import BN from 'bn.js';

export type ForceProperties<T, U> = { [P in keyof T]: U };

export type PositionTypeArgs = [string, string];

export type EventWithDate<E> = {
  createdAt: Date | undefined;
  event: E;
};

export type Position = {
  // baseCurrency: CoinStruct
  // quoteCurrency: CoinStruct
  amount_per_trade: BN;
  deposit: BN;
  last_trade_time: Date | null;
  received: BN;
  owner: string;

  /**
   * Seconds between trades.
   */
  frequency: number;
};

export type RawPosition = ForceProperties<Position, string>;

export function toPosition(raw: RawPosition): Position {
  const { last_trade_time } = raw;
  const lastTradeTimeMs = Number(last_trade_time);
  return {
    ...raw,
    amount_per_trade: new BN(raw.amount_per_trade),
    deposit: new BN(raw.deposit),
    last_trade_time: lastTradeTimeMs ? new Date(lastTradeTimeMs) : null,
    received: new BN(raw.received),
    frequency: Number(raw.frequency),
  };
}

export type Portfolio = {
  totalValue?: number;
  positions: Position[];
};

export type PositionCreationEvent = {
  position_id: string;
  creator: string;
  deposit_amount: BN;
};

export type RawPositionCreationEvent = ForceProperties<
  PositionCreationEvent,
  string
>;

export function toPositionCreationEvent(
  raw: RawPositionCreationEvent
): PositionCreationEvent {
  return {
    ...raw,
    deposit_amount: new BN(raw.deposit_amount),
  };
}

export type PositionDeletionEvent = {
  position_id: string;
  owner: string;
};

export type AssetAddEvent = {
  asset_id: string;
  coin_type_name: string;
  coinmeta_id: string;
  name: string;
};

export type Asset = {
  id: string;
  name: string;
  // Assume USD has 6 decimals
  price_usd: BN;
  decimals: number;
};

export type RawAsset = ForceProperties<Asset, string>;

export function toAsset(raw: RawAsset): Asset {
  return {
    ...raw,
    price_usd: new BN(raw.price_usd),
    decimals: Number(raw.decimals),
  };
}
