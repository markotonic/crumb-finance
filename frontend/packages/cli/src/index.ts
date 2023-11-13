import { Command } from 'commander';
import { TransactionBlock } from '@mysten/sui.js/transactions';

import {
  decimalToBn,
  updatePrice as addUpdatePrice,
  executeTrade as addExecuteTrade,
  addAsset as addAddAsset,
  addOracleCap as addAddOracleCap,
  getTradeOutAmount,
  priceUsdDecimalToBn,
} from '@crumb-finance/sdk';
import { getExplorerUrl } from '@crumb-finance/sdk';

import { getClients } from './services/sui';
import { getCoinGeckoPrice } from './services/prices';
import { sleep, loadKeystore } from './util';
import { add, differenceInSeconds } from 'date-fns';
import { Ed25519Keypair } from '@mysten/sui.js/dist/cjs/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/dist/cjs/client';

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
    getSignerInfo(): {
      signer: Ed25519Keypair;
      signerAddress: string;
      signAndSendTransactionBlock: (
        a: Omit<
          Parameters<SuiClient['signAndExecuteTransactionBlock']>[0],
          'signer'
        >
      ) => Promise<void>;
      getAdminCapId: () => Promise<string>;
      getOracleCapId: () => Promise<string>;
    };
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
    cmd.getSignerInfo = () => {
      const { signerAddress } = opts;
      if (!signerAddress) {
        throw new Error(
          'signer address not provided, use --signer-address or set the SIGNER_ADDRESS env var'
        );
      }
      const signer = cmd.keyStore[signerAddress];
      return {
        signer,
        signerAddress,
        signAndSendTransactionBlock: async (args) => {
          const res = await cmd.clients.sui.signAndExecuteTransactionBlock({
            ...args,
            signer,
          });
          const isSuccess = res.digest.length > 0 && !res.errors;
          const url = getExplorerUrl(res.digest, 'txblock', opts.suiNetwork);
          if (isSuccess) {
            console.log('success', url);
          } else {
            console.log('error', res.errors, url);
          }
        },
        getAdminCapId: () => cmd.clients.crumb.getAdminCapId(signerAddress),
        getOracleCapId: () => cmd.clients.crumb.getOracleCapId(signerAddress),
      };
    };
  });

program
  .command('get-assets')
  .description('Get list of assets supported by crumb')
  .action(async () => console.table(await program.clients.crumb.getAssets()));

program
  .command('add-asset')
  .description('Add asset. Caller must have Admin cap.')
  .requiredOption(
    '--global-table-id <value>',
    'Global cap',
    process.env.CRUMB_GLOBAL_TABLE_ID
  )
  .argument('<coinType>', 'coin type')
  .action(async (coinType: string, cmdOpts: { globalTableId: string }) => {
    const { getAdminCapId, signAndSendTransactionBlock } =
      program.getSignerInfo();
    const adminCapId = await getAdminCapId();

    const metadata = await program.clients.sui.getCoinMetadata({ coinType });
    if (!metadata || !metadata.id) {
      throw new Error(`Coin metadata not found for ${coinType}`);
    }

    const txb = new TransactionBlock();
    addAddAsset(program.clients.crumb.packageId, txb, {
      adminCapId,
      coinType,
      coinMetaId: metadata.id,
      globalTableId: cmdOpts.globalTableId,
    });

    await signAndSendTransactionBlock({ transactionBlock: txb });
  });

program
  .command('add-price-oracle')
  .description('Add price oracle. Caller must have Admin cap.')
  .argument('<address>', 'address of price oracle')
  .action(async (address: string) => {
    const { getAdminCapId, signAndSendTransactionBlock } =
      program.getSignerInfo();
    const adminCapId = await getAdminCapId();

    const txb = new TransactionBlock();
    addAddOracleCap(program.clients.crumb.packageId, txb, {
      adminCapId,
      receiverId: address,
    });

    await signAndSendTransactionBlock({ transactionBlock: txb });
  });

program
  .command('run-price-oracle')
  .description('Update asset prices in a loop. Caller must have Oracle cap.')
  .requiredOption('-i, --interval <value>', 'Interval in seconds', '60')
  .action(async (cmdOpts: { interval: string }) => {
    const { signAndSendTransactionBlock, getOracleCapId } =
      program.getSignerInfo();
    const oracleCapId = await getOracleCapId();

    const assets = await program.clients.crumb.getAssets();
    const intervalMs = parseInt(cmdOpts.interval) * 1000;

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
        await signAndSendTransactionBlock({ transactionBlock: txb });
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
    const { signAndSendTransactionBlock, signerAddress } =
      program.getSignerInfo();
    const intervalMs = parseInt(cmdOpts.interval) * 1000;

    const emptyPositionIds = new Set<string>();
    async function isPositionEligible(positionId: string) {
      if (emptyPositionIds.has(positionId)) {
        return false;
      }

      const position = await program.clients.crumb.getPosition(positionId);
      if (position.position.deposit.isZero()) {
        emptyPositionIds.add(positionId);
        return false;
      }

      const prevTradeTime = position.position.last_trade_time;
      if (!prevTradeTime) {
        return true;
      }

      const secondsSinceLastTrade = differenceInSeconds(
        prevTradeTime,
        new Date()
      );
      return secondsSinceLastTrade >= position.position.frequency;
    }

    while (true) {
      const assets = await program.clients.crumb.getAssets();
      const positions = await program.clients.crumb.getPositions();

      for (const position of positions.filter(
        (p) => p.outputCoinType === cmdOpts.coin
      )) {
        const isEligible = await isPositionEligible(
          position.event.event.position_id
        );
        if (!isEligible) {
          continue;
        }

        // example of how to determine trade amounts
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

        const tradeAmount = getTradeOutAmount(
          priceUsdDecimalToBn(inputPrice),
          priceUsdDecimalToBn(outputPrice),
          position.position.amount_per_trade
        );

        console.log(
          `Trading ${tradeAmount} ${position.outputCoinType}` +
            ` for ${position.inputCoinMetadata.symbol} at ${inputPrice}` +
            ` per ${position.inputCoinMetadata.symbol} and ${outputPrice}` +
            ` per ${position.outputCoinMetadata.symbol},` +
            ` positionId: ${position.event.event.position_id}`
        );

        // annoying. if these are missing, something is wrong
        const inputAssetId = assets.find(
          (a) => a.coinType === position.inputCoinType
        )!.event.event.asset_id;
        const outputAssetId = assets.find(
          (a) => a.coinType === position.outputCoinType
        )!.event.event.asset_id;

        const txb = new TransactionBlock();
        addExecuteTrade(program.clients.crumb.packageId, txb, {
          positionId: position.event.event.position_id,
          tradeOutCoinIds: coinObjectIds,
          inputCoinType: position.inputCoinType,
          outputCoinType: position.outputCoinType,

          inputAssetId,
          outputAssetId,
          tradeAmount,
        });

        await signAndSendTransactionBlock({ transactionBlock: txb });
      }

      console.log('waiting for interval', intervalMs);
      await sleep(intervalMs);
    }
  });

program.parse(process.argv);
