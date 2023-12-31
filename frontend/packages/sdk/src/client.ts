import { SuiClient } from '@mysten/sui.js/client';
import { getAssets } from './query/asset';
import {
  GetPositionsFilter,
  fetchPosition,
  getPositions,
} from './query/position';
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
    return await getCoinMetadata(this.sui, coinType);
  }

  async getPositions(filter?: GetPositionsFilter) {
    return await getPositions(this.sui, this.packageId, filter);
  }

  async getPosition(positionId: string) {
    return await fetchPosition(this.sui, positionId);
  }

  async subscribePositions(_params: { coinTypes?: string[] }) {
    // const existing =
    const _subscription = await this.sui.subscribeEvent({
      filter: {
        MoveEventType: `${this.packageId}::dca::PositionCreationEvent`,
      },
      onMessage(event) {
        console.log(event);
      },
    });
  }

  async getAssets() {
    return await getAssets(this.sui, this.packageId);
  }

  async getOracleCapId(owner: string) {
    const oracleCapQuery = await this.sui.getOwnedObjects({
      owner,
      filter: {
        StructType: `${this.packageId}::dca::Oracle`,
      },
      options: {
        showContent: true,
      },
    });
    const oracleCapId = oracleCapQuery.data.length
      ? oracleCapQuery.data[0].data?.objectId
      : undefined;

    if (!oracleCapId) {
      throw new Error('Oracle cap not found');
    }

    return oracleCapId;
  }

  async getAdminCapId(owner: string) {
    const adminCapQuery = await this.sui.getOwnedObjects({
      owner,
      filter: {
        StructType: `${this.packageId}::dca::Admin`,
      },
      options: {
        showContent: true,
      },
    });
    const adminCapId = adminCapQuery.data.length
      ? adminCapQuery.data[0].data?.objectId
      : undefined;

    if (!adminCapId) {
      throw new Error('Admin cap not found');
    }

    return adminCapId;
  }
}
