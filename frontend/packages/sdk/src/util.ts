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
