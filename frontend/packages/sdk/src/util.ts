import { SharedObjectRef } from '@mysten/sui.js/bcs';
import {
  TransactionArgument,
  TransactionBlock,
} from '@mysten/sui.js/transactions';
import { SuiObjectRef } from '@mysten/sui.js/client';

export function objArg(
  txb: TransactionBlock,
  arg: string | SharedObjectRef | SuiObjectRef | TransactionArgument
): TransactionArgument {
  if (typeof arg === 'string') {
    return txb.object(arg);
  }

  if ('digest' in arg && 'version' in arg && 'objectId' in arg) {
    return txb.objectRef(arg);
  }

  if ('objectId' in arg && 'initialSharedVersion' in arg && 'mutable' in arg) {
    return txb.sharedObjectRef(arg);
  }

  if ('kind' in arg) {
    return arg;
  }

  throw new Error('Invalid argument type');
}

export const nonEmpty = <TValue>(v: TValue | null | undefined): v is TValue =>
  v !== null && v !== undefined;

export function getExplorerUrl(
  id: string,
  kind: 'object' | 'address' | 'txblock' = 'object',
  network: 'devnet' | 'mainnet' = 'devnet'
) {
  // https://suiexplorer.com/object/0xeea308a42c6fbcc9bf5d563c5d8e1f774302be712ad1eae0bd8f65639aad2add?network=devnet
  return `https://suiexplorer.com/${kind}/${id}?network=${network}`;
}
