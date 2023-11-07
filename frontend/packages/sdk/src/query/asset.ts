import { CoinMetadata, SuiClient } from '@mysten/sui.js/dist/cjs/client';
import {
  Asset,
  AssetAddEvent,
  EventWithDate,
  RawAsset,
  toAsset,
} from '../types';
import { getCoinMetadata } from './coin';
import { nonEmpty } from '../util';

/**
 * It's annoying fetching these separately, and there's basically no case where
 * you don't want Asset and CoinMetadata together, so just get them all and
 * merge into a single object for convenience.
 */
type MessyAsset = {
  asset: Asset;
  event: EventWithDate<AssetAddEvent>;
  coinMetadata: CoinMetadata;
  coinType: string;
};

export async function getAssets(
  sui: SuiClient,
  packageId: string
): Promise<MessyAsset[]> {
  const { data } = await sui.queryEvents({
    query: {
      MoveEventType: `${packageId}::dca::AssetAddEvent`,
    },
  });

  const events = data.map((item) => {
    return {
      createdAt: item.timestampMs
        ? new Date(Number(item.timestampMs))
        : undefined,
      event: item.parsedJson as AssetAddEvent,
    } as EventWithDate<AssetAddEvent>;
  });

  const messyAssets = await Promise.all(
    events.map(async (event) => {
      try {
        const obj = await sui.getObject({
          id: event.event.asset_id,
          options: {
            showType: true,
            showContent: true,
          },
        });

        const rawCoinTypeName = event.event.coin_type_name;
        // replace leading 0s with 0x
        event.event.coin_type_name = rawCoinTypeName.replace(/^0+/, '0x');

        if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
          throw new Error('No content');
        }

        const asset = toAsset(obj.data.content.fields as RawAsset);
        const coinMetadata = await getCoinMetadata(
          sui,
          event.event.coin_type_name
        );

        return {
          asset,
          event,
          coinMetadata,
          coinType: event.event.coin_type_name,
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    })
  );

  return messyAssets.filter(nonEmpty);
}
