/** @jsxImportSource @emotion/react */
import tw from 'twin.macro';
import BN from 'bn.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { CreatePositionParams, decimalToBn } from '@crumb-finance/sdk';
import { MessyAsset } from '@crumb-finance/sdk/dist/query/asset';

import CoinIcon from './CoinIcon';
import Icon from './Icon';
import Input from './Input';
import Modal from './headless/Modal';
import useAssetsList from '@/hooks/useAssetsList';
import useCoinMetadata from '@/hooks/useCoinMetadata';
import { LoadableButton } from './Button';
import { QUERY_KEYS, SUI_COIN_TYPE } from '@/util/constants';
import { toast } from 'react-toastify';
import { useCreatePositionMutation } from '@/mutations/crumb';
import { useEffect } from 'react';
import { useOwnedCoins } from '@/hooks/useOwnedCoins';
import { useWalletBalance } from '@/hooks/useWalletBalance';

const Label = tw.label`font-bold text-sm`;

const AssetOption: React.FC<{
  asset: MessyAsset;
  onClick: (a: MessyAsset) => unknown;
}> = ({ asset, onClick }) => {
  const { data: balance } = useWalletBalance(asset.coinType);

  return (
    <div
      tw="flex items-center justify-between gap-12 hover:underline transition cursor-pointer"
      onClick={() => onClick(asset)}
    >
      <div tw="flex items-center gap-2">
        <CoinIcon tw="h-10 w-10" coinType={asset.coinType} />
        <div tw="flex flex-col justify-between">
          <p tw="leading-none text-lg font-medium">
            {asset.coinMetadata.symbol}
          </p>
          <p tw="text-base">{asset.coinMetadata.name}</p>
        </div>
      </div>

      <p tw="text-lg tabular-nums font-medium">
        {balance?.balanceDecimal?.toFixed(2) || '---'}{' '}
        {asset.coinMetadata.symbol}
      </p>
    </div>
  );
};

const AssetSelect: React.FC<{
  onSelect: (asset: MessyAsset) => void;
  selectedCoinType?: string;
}> = ({
  // name, control, setValue,
  onSelect,
  ...props
}) => {
  const { data: assets } = useAssetsList();
  const selectedAsset = assets?.find(
    (a) => a.coinType === props.selectedCoinType
  );

  return (
    <Modal
      title="Select Asset"
      trigger={({ openModal }) => {
        return (
          <button
            className="group"
            tw="overflow-hidden flex items-center justify-between gap-2 w-full border border-black rounded-lg p-2 bg-beige hover:bg-white transition"
            onClick={(e) => {
              e.preventDefault();
              openModal();
            }}
          >
            {selectedAsset ? (
              <CoinIcon
                tw="shrink-0 h-8 w-8"
                coinType={selectedAsset.coinType}
              />
            ) : (
              <span tw="h-8 w-8 block bg-cyan-50 border border-black rounded-full" />
            )}
            <span tw="grow overflow-hidden text-ellipsis flex flex-col items-start gap-0.5">
              <span tw="text-sm font-bold leading-none">
                {selectedAsset?.coinMetadata.symbol || '---'}
              </span>
              <span tw="text-xs font-medium whitespace-nowrap leading-none overflow-hidden text-ellipsis">
                {selectedAsset?.coinMetadata.name || '---'}
              </span>
            </span>
            <Icon.Select tw="shrink-0 text-sm" />
          </button>
        );
      }}
      closeLabel="Close"
    >
      {({ close }) =>
        !!assets && (
          <div tw="space-y-6 my-3">
            {assets.map((asset) => {
              return (
                <AssetOption
                  key={asset.coinType}
                  asset={asset}
                  onClick={(a) => {
                    onSelect(a);
                    close();
                  }}
                />
              );
            })}
          </div>
        )
      }
    </Modal>
  );
};

function daysToMsBn(days: number | string) {
  return new BN(days).muln(24).muln(60).muln(60).muln(1000);
}

const PositionCreateForm: React.FC = (props) => {
  const queryClient = useQueryClient();
  const { data: ownedCoins } = useOwnedCoins();

  const { isConnected } = useWalletKit();
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<CreatePositionParams>();

  const inputCoinType = watch('inputCoinType');
  const { data: inputCoinMeta } = useCoinMetadata(inputCoinType);
  const outputCoinType = watch('outputCoinType');
  const { data: outputCoinMeta } = useCoinMetadata(outputCoinType);

  // used when changing assets
  const resetDepositAmount = () => {
    setValue('depositAmountRaw', '');
    setValue('depositAmountMax', undefined);
  };

  // NOTE: didn't bother to rename the type in the tx params. We convert
  // to native BN in the submit handler
  const depositAmountDecimal = watch('depositAmountRaw');
  const amountPerTrade = watch('amountPerTrade');
  const frequency = watch('frequency');

  // set default input/output on form load
  useEffect(() => {
    if (ownedCoins?.length && !inputCoinType && !outputCoinType) {
      // find first non-sui input coin or leave it
      const firstNonSui = ownedCoins.find((c) => c.coinType !== SUI_COIN_TYPE)
        ?.coinType;
      if (firstNonSui?.length) {
        setValue('inputCoinType', firstNonSui);
      }

      // set output to sui
      setValue('outputCoinType', SUI_COIN_TYPE);
    }
  }, [ownedCoins, setValue, inputCoinType, outputCoinType]);

  // unset max if the user manually types in the deposit amount
  useEffect(() => {
    setValue('depositAmountMax', undefined, { shouldValidate: false });
  }, [depositAmountDecimal]);

  const { data: walletBalance } = useWalletBalance(inputCoinType);

  // for most coins, setting max just means using the actual max. For SUI though,
  // we have to reserve some for gas, which we'll just call 1 SUI
  const setMax = () => {
    if (walletBalance?.balanceDecimal === undefined) return;

    if (inputCoinType === SUI_COIN_TYPE) {
      setValue(
        'depositAmountRaw',
        (walletBalance.balanceDecimal - 1).toString()
      );
      // notice we don't actually use max in this case
      setValue('depositAmountMax', undefined);
    } else {
      setValue('depositAmountRaw', walletBalance.balanceDecimal.toString());
      setValue('depositAmountMax', true);
    }
  };

  const createPosition = useCreatePositionMutation({
    onSuccess() {
      queryClient.invalidateQueries([QUERY_KEYS.POSITIONS_LIST]);
      toast('Position created.');
      reset();
    },
  });

  const submit = handleSubmit((data) => {
    if (inputCoinType === outputCoinType) {
      toast.error('Input and output coins must be different.');
      return;
    }
    if (inputCoinMeta) {
      return createPosition.mutate({
        ...data,
        depositCoinObjectIds: walletBalance?.coinIds ?? [],
        frequency: daysToMsBn(data.frequency.toString()),
        depositAmountRaw: decimalToBn(
          data.depositAmountRaw as string,
          inputCoinMeta.decimals
        ),
        amountPerTrade: decimalToBn(
          data.amountPerTrade as string,
          inputCoinMeta.decimals
        ),
      });
    }
  });

  return (
    <form tw="flex flex-col items-stretch gap-4" onSubmit={submit} {...props}>
      <div tw="grid grid-cols-2 gap-4">
        <div tw="space-y-2">
          <Label>Deposit</Label>
          <AssetSelect
            selectedCoinType={inputCoinType}
            onSelect={(asset) => {
              setValue('inputCoinType', asset.coinType);
              resetDepositAmount();
            }}
          />
        </div>

        <div tw="space-y-2">
          <Label>Purchase</Label>
          <AssetSelect
            selectedCoinType={outputCoinType}
            onSelect={(asset) => {
              setValue('outputCoinType', asset.coinType);
              resetDepositAmount();
            }}
          />
        </div>
      </div>

      <div tw="space-y-2">
        <div tw="flex items-center justify-between">
          <Label>Deposit amount</Label>
          <span tw="text-sm font-medium tabular-nums">
            Wallet: {walletBalance?.balanceDecimal?.toFixed(2) || '---'}{' '}
            {inputCoinMeta?.symbol || '---'}
          </span>
        </div>
        <div tw="relative">
          <span tw="absolute right-0 top-0 bottom-0 flex items-center pr-4">
            <button
              tw="text-sm font-medium bg-cyan-50 hover:bg-white transition rounded border border-black px-1.5"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setMax();
              }}
            >
              Max
            </button>
          </span>
          <Input
            {...register('depositAmountRaw')}
            placeholder="Deposit amount"
            inputMode="numeric"
            type="number"
            max={walletBalance?.balanceDecimal}
            step="1e-16"
            required
          />
        </div>
      </div>

      <div tw="space-y-2">
        <Label>Amount per trade ({inputCoinMeta?.symbol || '---'})</Label>
        <Input
          {...register('amountPerTrade')}
          placeholder="Amount per trade"
          type="number"
          inputMode="numeric"
          max={depositAmountDecimal as string}
          step="1e-16"
          required
        />
      </div>

      <div tw="space-y-2">
        <Label>Frequency (Days)</Label>
        <Input
          {...register('frequency')}
          step={1}
          min={1}
          type="number"
          inputMode="numeric"
          placeholder="Days"
          required
        />
      </div>

      {inputCoinMeta &&
        outputCoinMeta &&
        amountPerTrade &&
        depositAmountDecimal &&
        frequency && (
          <div>
            <Label>Position Preview</Label>
            <p tw="text-sm font-medium">
              Deposit {depositAmountDecimal as string} {inputCoinMeta.symbol}.
              Invest {amountPerTrade as string} {inputCoinMeta.symbol} into{' '}
              {outputCoinMeta.symbol} every {frequency as string}{' '}
              {Number(frequency) > 1 ? 'days' : 'day'}.
            </p>
          </div>
        )}

      <LoadableButton
        tw="py-3"
        type="submit"
        loading={createPosition.isLoading}
        disabled={!isConnected}
      >
        Create Position
      </LoadableButton>
    </form>
  );
};

export default PositionCreateForm;
