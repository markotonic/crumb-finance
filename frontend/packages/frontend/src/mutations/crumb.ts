import { TransactionBlock } from '@mysten/sui.js/transactions';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { useWalletKit } from '@mysten/wallet-kit';

import { useTransactionExecution } from '@/hooks/useTransactionExecution';
import {
  CreatePositionParams,
  createPosition as addCreatePosition,
  withdrawFunds as addWithdrawFunds,
  executeTrade as addExecuteTrade,
  updatePrice as addUpdatePrice,
  ClosePositionParams,
  Position,
  UpdatePriceParams,
  priceUsdDecimalToBn,
} from '@crumb-finance/sdk';
import { CRUMB_PACKAGE_ID } from '@/config';
import useAssetsList from '@/hooks/useAssetsList';
import { useCrumb, useRpc } from '@/context/RpcContext';

const GAS_BUDGET = 100_000_000; // 0.1 SUI

type MutationParams = {
  onSuccess?: (hash: string) => void;
  onError?: (e: Error) => void;
};

function defaultOnError(e: Error) {
  if (typeof e === 'string') toast.error(e);
  else toast.error(e?.message || 'Something went wrong');
}

export function useCreatePositionMutation({
  onSuccess,
  onError,
}: MutationParams) {
  const { currentAccount } = useWalletKit();
  const { signAndExecute } = useTransactionExecution();

  return useMutation({
    mutationFn: (params: CreatePositionParams) => {
      if (!currentAccount?.address)
        throw new Error('You need to connect your wallet!');

      const tx = new TransactionBlock();
      tx.setGasBudget(100_000_000); // 0.1 SUI
      addCreatePosition(CRUMB_PACKAGE_ID, tx, params);

      return signAndExecute({ tx });
    },
    onSuccess,
    onError: onError || defaultOnError,
  });
}

export function useWithdrawFundsMutation({
  onSuccess,
  onError,
}: MutationParams) {
  const { currentAccount } = useWalletKit();
  const { signAndExecute } = useTransactionExecution();

  return useMutation({
    mutationFn: (params: ClosePositionParams) => {
      if (!currentAccount?.address)
        throw new Error('You need to connect your wallet!');

      const tx = new TransactionBlock();
      tx.setGasBudget(GAS_BUDGET);
      addWithdrawFunds(CRUMB_PACKAGE_ID, tx, params);

      return signAndExecute({ tx });
    },
    onSuccess,
    onError: onError || defaultOnError,
  });
}

export function useUpdatePriceMutation({ onSuccess, onError }: MutationParams) {
  const { currentAccount } = useWalletKit();
  const { signAndExecute } = useTransactionExecution();
  const { data: assets } = useAssetsList();
  const sui = useRpc();
  const crumb = useCrumb();

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount?.address)
        throw new Error('You need to connect your wallet!');

      const oracleCapId = await crumb.getOracleCapId(currentAccount.address);

      const asset = assets?.[0];
      if (!asset) {
        throw new Error('no assets found');
      }

      const tx = new TransactionBlock();
      tx.setGasBudget(GAS_BUDGET);
      addUpdatePrice(CRUMB_PACKAGE_ID, tx, {
        oracleCapId,
        assetId: asset.event.event.asset_id,
        priceBn: priceUsdDecimalToBn(4.2),
        assetTokenType: asset.coinType,
      });

      return signAndExecute({ tx });
    },
    onSuccess,
    onError: onError || defaultOnError,
  });
}

export function useExecutePositionMutation({
  onSuccess,
  onError,
}: MutationParams) {
  const rpc = useRpc();
  const { currentAccount } = useWalletKit();
  const { signAndExecute } = useTransactionExecution();
  const { data } = useAssetsList();

  return useMutation({
    mutationFn: async (hackParams: {
      positionId: string;
      position: Position;
      inputCoinType: string;
      outputCoinType: string;
      sellCoinId: string;
    }) => {
      if (!currentAccount?.address)
        throw new Error('You need to connect your wallet!');

      if (!data) {
        throw new Error('Assets not loaded');
      }

      const inputTokenMeta = await rpc.getCoinMetadata({
        coinType: hackParams.inputCoinType,
      });
      const outputTokenMeta = await rpc.getCoinMetadata({
        coinType: hackParams.outputCoinType,
      });
      if (!inputTokenMeta || !outputTokenMeta) {
        throw new Error('Token metadata not found');
      }

      const inputAsset = data.find((a) => a.asset.name === inputTokenMeta.name);
      const outputAsset = data.find(
        (a) => a.asset.name === outputTokenMeta.name
      );
      if (!inputAsset || !outputAsset) {
        throw new Error('Assets not found');
      }

      const tx = new TransactionBlock();
      tx.setGasBudget(GAS_BUDGET);
      addExecuteTrade(CRUMB_PACKAGE_ID, tx, {
        positionId: hackParams.positionId,
        inputAssetId: inputAsset.event.event.asset_id,
        outputAssetId: outputAsset.event.event.asset_id,
        inputCoinType: hackParams.inputCoinType,
        outputCoinType: hackParams.outputCoinType,
        tradeOutCoinIds: [hackParams.sellCoinId],
        tradeAmount: hackParams.position.amount_per_trade.toString(),
      });

      return signAndExecute({ tx });
    },
    onSuccess,
    onError: onError || defaultOnError,
  });
}
