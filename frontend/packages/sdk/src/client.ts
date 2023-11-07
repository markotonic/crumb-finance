import { SuiClient } from '@mysten/sui.js/client';
import { getAssets } from './query/asset';
import { getOwnedPositions } from './query/position';
import { getCoinMetadata } from './query/coin';

export class CrumbClient {
  constructor(
    readonly sui: SuiClient,
    readonly packageId: string
  ) {}

  /**
   * cached version, use this instead of calling sui.getCoinMetadata directly
   * to avoid extra requests
   */
  async getCoinMetadata(coinType: string) {
    console.log('fuck?');
    return await getCoinMetadata(this.sui, coinType);
  }

  async getOwnedPositions(owner: string) {
    return await getOwnedPositions(this.sui, this.packageId, owner);
  }

  async getAssets() {
    return await getAssets(this.sui, this.packageId);
  }
}
