import { Command } from 'commander';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import {
  decimalToBn,
  updatePrice as addUpdatePrice,
  executeTrade as addExecuteTrade,
} from '@crumb-finance/sdk';
import { getExplorerUrl } from '@crumb-finance/sdk';

import { getClients } from './services/sui';
import { getCoinGeckoPrice } from './services/prices';
import { sleep, loadKeystore } from './util';
import { BN } from 'bn.js';

const program = new Command('crumb-cli');

interface CLIOptions {
  suiNetwork: 'devnet' | 'mainnet';
  crumbPackageId: string;
  signerAddress?: string;
}

declare module 'commander' {
  export interface Command {
    opts<T>(): CLIOptions & T;
    clients: ReturnType<typeof getClients>;
    keyStore: Awaited<ReturnType<typeof loadKeystore>>;
  }
}

program
  .version('1.0.0')
  .description('Crumb CLI')
  .requiredOption('-i, --interval <value>', 'Interval in seconds', '60')
  .requiredOption(
    '-s, --sui-network <value>',
    'SUI network to use',
    process.env.SUI_NETWORK
  )
  .requiredOption(
    '-c, --crumb-package-id <value>',
    'Crumb package ID',
    process.env.CRUMB_PACKAGE_ID
  )
  // optional signer
  .option(
    '-a, --signer-address <value>',
    'Signer address',
    process.env.SIGNER_ADDRESS
  )
  .hook('preAction', async (cmd) => {
    const opts = cmd.opts();
    cmd.clients = getClients(opts.suiNetwork, opts.crumbPackageId);
    cmd.keyStore = await loadKeystore();
  });

program
  .command('get-assets')
  .description('Get list of assets supported by crumb')
  .argument('[foo]', 'example arg, use <> for required')
  .action(async (_foo?: string) => {
    const assets = await program.clients.crumb.getAssets();
    console.table(assets);
  });

program
  .command('run-price-oracle')
  .description('Update asset prices in a loop')
  .requiredOption('-i, --interval <value>', 'Interval in seconds', '60')
  .action(async (cmdOpts: { interval: string }) => {
    const { signerAddress, suiNetwork } = program.opts();

    const assets = await program.clients.crumb.getAssets();
    const intervalMs = parseInt(cmdOpts.interval) * 1000;

    if (!signerAddress) {
      throw new Error(
        'signer address not provided, use --signer-address or set the SIGNER_ADDRESS env var'
      );
    }

    const signer = program.keyStore[signerAddress];
    const oracleCapId =
      await program.clients.crumb.getOracleCapId(signerAddress);

    while (true) {
      for (const asset of assets) {
        const price = await getCoinGeckoPrice(asset.coinMetadata.symbol);
        const priceBn = decimalToBn(price, 6); // assume USDC has 6 decimals

        console.log(
          `Updating price for ${asset.coinMetadata.symbol} to ${price}`
        );
        const txb = new TransactionBlock();
        addUpdatePrice(program.clients.crumb.packageId, txb, {
          assetId: asset.event.event.asset_id,
          assetTokenType: asset.coinType,
          oracleCapId,
          priceBn,
        });

        const res = await program.clients.sui.signAndExecuteTransactionBlock({
          transactionBlock: txb,
          signer,
        });

        const isSuccess = res.digest.length > 0 && !res.errors;
        const url = getExplorerUrl(res.digest, 'txblock', suiNetwork);
        if (isSuccess) {
          console.log('success', url);
        } else {
          console.log('error', res.errors, url);
        }
      }

      console.log('waiting for interval', intervalMs);
      await sleep(intervalMs);
    }
  });

program
  .command('run-executor')
  .description('Trade tokens against positions in a loop')
  .requiredOption('--interval <value>', 'Interval in seconds', '60')
  .requiredOption('--coin <value>', 'coin ID to trade')
  .action(async (cmdOpts: { interval: string; coin: string }) => {
    const { signerAddress, suiNetwork } = program.opts();
    const intervalMs = parseInt(cmdOpts.interval) * 1000;

    if (!signerAddress) {
      throw new Error(
        'signer address not provided, use --signer-address or set the SIGNER_ADDRESS env var'
      );
    }

    const signer = program.keyStore[signerAddress];

    while (true) {
      const assets = await program.clients.crumb.getAssets();
      const positions = await program.clients.crumb.getPositions();
      // TODO
      const eligiblePositions: typeof positions = [];

      for (const position of eligiblePositions) {
        const inputPrice = await getCoinGeckoPrice(
          position.inputCoinMetadata.symbol
        );
        const outputPrice = await getCoinGeckoPrice(
          position.outputCoinMetadata.symbol
        );
        const coins = await program.clients.sui.getCoins({
          owner: signerAddress,
          coinType: cmdOpts.coin,
        });
        const coinObjectIds = coins.data.map((c) => c.coinObjectId);

        // TODO
        const tradeAmount = new BN(0);

        // TODO
        // console.log(
        //   `Updating price for ${asset.coinMetadata.symbol} to ${price}`
        // );
        const txb = new TransactionBlock();
        addExecuteTrade(program.clients.crumb.packageId, txb, {
          positionId: position.event.event.position_id,
          tradeOutCoinIds: coinObjectIds,
          inputCoinType: position.inputCoinType,
          outputCoinType: position.outputCoinType,

          // TODO
          inputAssetId: '',
          outputAssetId: '',
          tradeAmount,
        });

        const res = await program.clients.sui.signAndExecuteTransactionBlock({
          transactionBlock: txb,
          signer,
        });

        const isSuccess = res.digest.length > 0 && !res.errors;
        const url = getExplorerUrl(res.digest, 'txblock', suiNetwork);
        if (isSuccess) {
          console.log('success', url);
        } else {
          console.log('error', res.errors, url);
        }
      }

      console.log('waiting for interval', intervalMs);
      await sleep(intervalMs);
    }
  });

program.parse(process.argv);
