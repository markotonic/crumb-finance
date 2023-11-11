import { SuiObjectResponse } from '@mysten/sui.js/client';

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
