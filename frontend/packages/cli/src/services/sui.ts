import { CrumbClient } from '@crumb-finance/sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

export function getClients(suiNetwork: string, crumbPackageId: string) {
  const sui = new SuiClient({ url: getFullnodeUrl(suiNetwork as never) });
  const crumb = new CrumbClient(sui, crumbPackageId);

  return { sui, crumb };
}
