import { CoinMetadata, SuiClient } from '@mysten/sui.js/dist/cjs/client';

let _COIN_METADATA_CACHE: Record<string, CoinMetadata> = {};

export async function getCoinMetadata(sui: SuiClient, coinType: string) {
  if (!_COIN_METADATA_CACHE[coinType]) {
    const meta = await sui.getCoinMetadata({
      coinType,
    });
    if (!meta) {
      throw new Error('No coin metadata for ' + coinType);
    }
    _COIN_METADATA_CACHE[coinType] = meta;
  }

  return _COIN_METADATA_CACHE[coinType];
}
