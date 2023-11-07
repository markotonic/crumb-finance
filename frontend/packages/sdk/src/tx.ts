import BN from 'bn.js';
import {
  TransactionBlock,
  TransactionObjectArgument,
} from '@mysten/sui.js/transactions';

import { objArg } from './util';
import { SUI_COIN_TYPE } from './constants';

export type CrumbMethodName =
  | 'create_position'
  | 'execute_trade'
  | 'close_position'
  | 'withdraw_funds';

type EnforceProperties<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: Exclude<T[P], undefined>;
};

function requireProperties<T, K extends keyof T>(
  params: T,
  required: K[]
): EnforceProperties<T, K> {
  for (const key of required) {
    if (params[key] === null || params[key] === undefined) {
      throw new Error(`Missing required property: ${key as string}`);
    }
  }
  return params as EnforceProperties<T, K>;
}

function crumbMethod(
  packageId: string,
  name: CrumbMethodName
): `${string}::${string}::${string}` {
  return `${packageId}::dca::${name}`;
}

function mergeCoins(
  tx: TransactionBlock,
  coins: (string | TransactionObjectArgument)[]
) {
  if (coins.length > 1) {
    // mergeCoins doesn't return a coin, it just merges them into the first one,
    // so the way to use it is to just call this to add it to the transaction.
    tx.mergeCoins(coins[0], coins.slice(1));
  }
  return coins[0];
}

function splitCoinsOrMax(
  tx: TransactionBlock,
  coin: string | TransactionObjectArgument,
  amount?: string | BN,
  max?: boolean
) {
  if (max) {
    return coin;
  } else {
    if (!amount) {
      throw new Error('Missing amount');
    }
    return tx.splitCoins(coin, [tx.pure(amount, 'u64')]);
  }
}

function mergeCoinsAndSplit(
  tx: TransactionBlock,
  coins: (string | TransactionObjectArgument)[],
  /**
   * Optional amount in native format. Either `amount` or `max` must be set.
   */
  amount?: string | BN,
  /**
   * Use the maximum amount of the coin. Either `amount` or `max` must be set.
   * The only value of max, if set, is `true`.
   */
  max?: true
) {
  const merged = mergeCoins(tx, coins);
  return splitCoinsOrMax(tx, merged, amount, max);
}

export type CreatePositionParams = {
  // type arg
  inputCoinType: string;

  // type arg
  outputCoinType: string;

  /**
   * List of coins to deposit. Coins will be merged before the requested
   * deposit amount is split off.
   */
  depositCoinObjectIds: string[];

  /**
   * Raw amount of coin to deposit
   */
  depositAmountRaw: string | BN;

  /**
   * Whether to deposit the maximum amount of the coin. If provided, skips
   * splitting the coin.
   */
  depositAmountMax: boolean;

  /**
   * Amount of deposit to spend per trade
   */
  amountPerTrade: string | BN;

  /**
   * How often to place trade, seconds
   */
  frequency: string | BN | number;
};

/**
 * Call create_position. Signature:
 * ```
 * create_position<InputToken, OutputToken>(
 *     deposit: Coin<InputToken>,
 *     amount_per_trade: u64,
 *     frequency: u64,
 *     ctx: &mut TxContext,
 * ): ID
 * ```
 */
export function createPosition(
  packageId: string,
  tx: TransactionBlock,
  _params: Partial<CreatePositionParams>
) {
  const params = requireProperties(_params, [
    'depositCoinObjectIds',
    'depositAmountRaw',
    'amountPerTrade',
    'frequency',
    'inputCoinType',
    'outputCoinType',
  ]);

  // HACK: if the sender is depositing SUI and only has one SUI coin, the sui
  // sdk will automatically use it as the gas payment. If this happens, then you
  // must split tx.gas to pay for the deposit coin, but there's no way to tell
  // from this function whether they have one sui coin or not. So, we just assume
  // that if they're depositing SUI and only have one deposit object set, that we
  // need to split tx.gas. The way this is actually achieved is to simply replace
  // a random coin ID with tx.gas whenever the input coin is SUI.
  const hackNeedsGasSplit = params.inputCoinType === SUI_COIN_TYPE;

  const depositCoinIds = hackNeedsGasSplit
    ? [tx.gas, ...params.depositCoinObjectIds.slice(1)]
    : params.depositCoinObjectIds;

  const deposit = mergeCoinsAndSplit(
    tx,
    depositCoinIds,
    params.depositAmountRaw.toString(),
    params.depositAmountMax || undefined
  );

  const [positionId] = tx.moveCall({
    target: crumbMethod(packageId, 'create_position'),
    arguments: [
      objArg(tx, deposit),
      tx.pure(params.amountPerTrade, 'u64'),
      tx.pure(params.frequency.toString(), 'u64'),
    ],
    typeArguments: [params.inputCoinType, params.outputCoinType],
  });

  return positionId;
}

export type ExecuteTradeParams = {
  positionId: string;

  /**
   * IDs of coins to be sold, will be merged into one coin before
   * the splitting off the trade amount.
   */
  tradeOutCoinIds: string[];

  // lol
  inputAssetId: string;

  outputAssetId: string;

  // type arg
  inputCoinType: string;

  // type arg
  outputCoinType: string;

  tradeAmountMax?: boolean;

  tradeAmount?: string;
};

/**
 * Call execute_trade. Signature:
 *
 * ```
 * public fun execute_trade<InputToken, OutputToken>(
 *    position: &mut Position<InputToken, OutputToken>,
 *    // this refers to the coin being sold, ie, the caller of this function
 *    // owns this coin and is selling it to the position
 *    trade_out: Coin<OutputToken>,
 *    input_asset: &Asset<InputToken>,
 *    output_asset: &Asset<OutputToken>
 * ): Balance<InputToken> {
 * ```
 */
export function executeTrade(
  packageId: string,
  tx: TransactionBlock,
  _params: Partial<ExecuteTradeParams>
) {
  const params = requireProperties(_params, [
    'tradeOutCoinIds',
    'positionId',
    'inputAssetId',
    'outputAssetId',
    'inputCoinType',
    'outputCoinType',
  ]);

  const coin = mergeCoinsAndSplit(
    tx,
    params.tradeOutCoinIds,
    params.tradeAmount,
    params.tradeAmountMax || undefined
  );

  const [res] = tx.moveCall({
    target: crumbMethod(packageId, 'execute_trade'),
    arguments: [
      objArg(tx, params.positionId),
      typeof coin === 'string' ? tx.object(coin) : coin,
      tx.object(params.inputAssetId),
      tx.object(params.outputAssetId),
    ],
    typeArguments: [params.inputCoinType, params.outputCoinType],
  });

  return res;
}

export type ClosePositionParams = {
  positionId: string;
  inputCoinType: string;
  outputCoinType: string;
};

export function closePosition(
  packageId: string,
  tx: TransactionBlock,
  params: ClosePositionParams
) {
  const [res] = tx.moveCall({
    target: crumbMethod(packageId, 'close_position'),
    arguments: [tx.object(params.positionId)],
    typeArguments: [params.inputCoinType, params.outputCoinType],
  });

  return res;
}

export type WithdrawFundsParams = {
  positionId: string;
  inputCoinType: string;
  outputCoinType: string;
};

export function withdrawFunds(
  packageId: string,
  tx: TransactionBlock,
  params: WithdrawFundsParams
) {
  const [res] = tx.moveCall({
    target: crumbMethod(packageId, 'withdraw_funds'),
    arguments: [tx.object(params.positionId)],
    typeArguments: [params.inputCoinType, params.outputCoinType],
  });

  return res;
}
