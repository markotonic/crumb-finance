import { SuiObjectResponse } from '@mysten/sui.js/client';
import { SUI_NETWORK } from './constants';

/**
 * Parse the display of a list of objects into a simple {object_id: display} map
 * to use throughout the app.
 */
export function parseObjectDisplays(
  data: SuiObjectResponse[]
): Record<string, Record<string, string> | undefined> {
  return data.reduce<Record<string, Record<string, string> | undefined>>(
    (acc, item: SuiObjectResponse) => {
      const display = item.data?.display?.data;
      const id = item.data?.objectId!;
      acc[id] = display || undefined;
      return acc;
    },
    {}
  );
}

export function getExplorerUrl(
  id: string,
  kind: 'object' | 'address' = 'object'
) {
  // https://suiexplorer.com/object/0xeea308a42c6fbcc9bf5d563c5d8e1f774302be712ad1eae0bd8f65639aad2add?network=devnet
  return `https://suiexplorer.com/${kind}/${id}?network=${SUI_NETWORK}`;
}
