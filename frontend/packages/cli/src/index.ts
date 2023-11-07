import { Command } from 'commander';
import { getClients } from './services/sui';
import { getCoinGeckoPrice } from './services/prices';

const program = new Command('crumb-cli');

interface CLIOptions {
  suiNetwork: string;
  crumbPackageId: string;
}

declare module 'commander' {
  export interface Command {
    opts(): CLIOptions;
    clients: ReturnType<typeof getClients>;
  }
}

program
  .version('1.0.0')
  .description('Crumb CLI')
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
  .hook('preAction', (cmd) => {
    const opts = cmd.opts();
    cmd.clients = getClients(opts.suiNetwork, opts.crumbPackageId);
  })
  .parse(process.argv);

program
  .command('get-assets')
  .description('Get list of assets supported by crumb')
  .argument('[foo]', 'example arg, use <> for required')
  .action(async (_foo?: string) => {
    const { assets } = await program.clients.crumb.getAssets();
    console.table(assets);
  });

program
  .command('update-asset-price')
  .description('Update asset price')
  // not sure how to pass asset, note that asset event only has name not symbol
  // or coin type
  .argument('<symbol>', 'Symbol of asset to update')
  .action(async (symbol: string) => {
    const { assets } = await program.clients.crumb.getAssets();
    const price = await getCoinGeckoPrice(symbol);

    // what to do here?

    console.log('price USD', price);

    // see crumb.ts in frontend for example of signing tx
  });

program.parse(process.argv);
