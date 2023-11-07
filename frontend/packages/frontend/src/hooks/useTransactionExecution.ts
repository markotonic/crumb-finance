import { SuiTransactionBlockResponseOptions } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useWalletKit } from '@mysten/wallet-kit';

import { useRpc } from '../context/RpcContext';

// A helper to execute transactions by:
// 1. Signing them using the wallet
// 2. Executing them using the rpc provider
export function useTransactionExecution() {
  const provider = useRpc();

  // sign transaction from the wallet
  const { signTransactionBlock } = useWalletKit();

  // tx: TransactionBlock
  const signAndExecute = async ({
    tx,
    options = { showEffects: true },
  }: {
    tx: TransactionBlock;
    options?: SuiTransactionBlockResponseOptions | undefined;
  }) => {
    // @ts-ignore something in this is private idk
    const signedTx = await signTransactionBlock({ transactionBlock: tx });

    const res = await provider.executeTransactionBlock({
      transactionBlock: signedTx.transactionBlockBytes,
      signature: signedTx.signature,
      options,
    });

    const status = res.effects?.status?.status === 'success';

    if (status) {
      return res.digest;
    } else {
      throw new Error('Transaction execution failed.');
    }
  };

  return { signAndExecute };
}
