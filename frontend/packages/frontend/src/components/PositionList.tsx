/** @jsxImportSource @emotion/react */
'use client';
import 'twin.macro';
import BN from 'bn.js';

import usePosition from '@/hooks/usePosition';
import usePositionsList from '@/hooks/usePositionsList';
import Loading from './Loading';
import Button from './Button';
import useCoinMetadata from '@/hooks/useCoinMetadata';
import { bnToApproximateDecimal } from '@/util/math';
import useCoinPrice from '@/hooks/useCoinPrice';
import {
  useExecutePositionMutation,
  useWithdrawFundsMutation,
} from '@/mutations/crumb';
import { QUERY_KEYS } from '@/util/constants';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { getExplorerUrl } from '@/util/sui';
import { useOwnedCoins } from '@/hooks/useOwnedCoins';
import { IS_DEV } from '@/config';
import CoinIcon from './CoinIcon';
import { PositionCreationEventWithDate } from '@crumb-finance/sdk/dist/query/position';

const Stat: React.FC<{ label: React.ReactNode; value: React.ReactNode }> = ({
  label,
  value,
  ...props
}) => {
  return (
    <div {...props}>
      <p tw="font-bold text-sm mb-1">{label}</p>
      <p tw="text-sm font-medium">{value}</p>
    </div>
  );
};

function PositionProgressBar({
  coinType,
  originalAmount,
  remainingAmount,
}: {
  coinType: string;
  originalAmount: BN;
  remainingAmount: BN;
}) {
  const { data } = useCoinMetadata(coinType);

  if (!data) {
    return '---';
  }

  console.log('meta', data);

  const orig = bnToApproximateDecimal(originalAmount, data.decimals);
  const rem = bnToApproximateDecimal(remainingAmount, data.decimals);
  const percentage = rem === 0 ? 100 : ((orig - rem) / orig) * 100;

  return (
    <div tw="h-4 w-full border border-black rounded overflow-hidden">
      {percentage > 0 && (
        <div
          tw="h-full bg-gradient-to-r from-green-500 to-green-400 border-r border-black"
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  );
}

const TokenAmount: React.FC<{ coinType: string; raw: BN }> = ({
  coinType,
  raw,
}) => {
  const { data } = useCoinMetadata(coinType);

  if (!data) {
    return '---';
  }

  return `${bnToApproximateDecimal(raw, data.decimals)} ${data.symbol}`;
};

const TokenValue: React.FC<{ coinType: string; raw: BN }> = ({
  coinType,
  raw,
}) => {
  const { data: meta } = useCoinMetadata(coinType);
  const { data } = useCoinPrice(meta?.symbol || '');

  if (!meta || !data) {
    return '---';
  }

  const balance = bnToApproximateDecimal(raw, meta.decimals);

  return `$${(data * balance).toFixed(2)}`;
};

function formatSchedule(intervalSeconds: number) {
  // get number of days between purchases
  const days = Math.round(intervalSeconds / 60 / 60 / 24 / 1000);
  if (days === 1) {
    return `Once per day`;
  }
  return `Once every ${days} days`;
}

function useHackExecute() {}

export function PositionOverview({
  event: { event, createdAt },
}: {
  event: PositionCreationEventWithDate;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = usePosition(event.position_id);

  const inputCoinType = data?.typeArgs?.[0] || '';
  const outputCoinType = data?.typeArgs?.[1] || '';
  const { data: inputCoin } = useCoinMetadata(inputCoinType);
  const { data: outputCoin } = useCoinMetadata(outputCoinType);

  const withdrawFunds = useWithdrawFundsMutation({
    onSuccess() {
      queryClient.invalidateQueries([QUERY_KEYS.POSITIONS_LIST]);
      toast('Position closed.');
    },
  });

  const handleWithdrawFunds = () => {
    if (inputCoinType.length && outputCoinType.length) {
      withdrawFunds.mutate({
        inputCoinType,
        outputCoinType,
        positionId: event.position_id,
      });
    }
  };

  // <HACK>
  const { data: ownedcoins } = useOwnedCoins();
  const executePosition = useExecutePositionMutation({
    onSuccess: console.log,
  });
  const handleExecutePosition = () => {
    executePosition.mutate({
      sellCoinId: ownedcoins![0].coinObjectId,
      position: data!.position,
      inputCoinType: data!.typeArgs[0],
      outputCoinType: data!.typeArgs[0],
      positionId: event.position_id,
    });
  };
  // </HACK>

  if (isLoading || !data) {
    return null;
  }

  return (
    <div
      className="group"
      tw="relative flex flex-col items-stretch gap-3 p-6 pt-4 border border-black rounded-2xl shadow-hard bg-white"
    >
      <div tw="flex items-center gap-3">
        <div tw="flex items-center gap-2">
          <CoinIcon tw="w-10 h-10" coinType={outputCoinType} />
          <CoinIcon tw="w-10 h-10" coinType={inputCoinType} />
        </div>
        <div tw="flex items-center gap-1.5 overflow-hidden">
          <p tw="text-ellipsis overflow-hidden whitespace-nowrap">
            <span tw="font-bold text-xl">{outputCoin?.symbol || '---'}</span>{' '}
            <span tw="text-xl font-medium opacity-50">
              {outputCoin?.name || '---'}
            </span>
          </p>
        </div>
        {!data.position.last_trade_time && (
          <span tw="px-1.5 py-0.5 rounded-md bg-amber-400 text-black border  border-black font-bold text-xs uppercase">
            NEW
          </span>
        )}

        <div tw="grow flex flex-col items-end">
          <p tw="text-xl font-medium tabular-nums">
            <TokenAmount
              coinType={outputCoinType}
              raw={data.position.received}
            />
          </p>
          <p tw="text-base font-medium tabular-nums">
            <TokenValue
              coinType={outputCoinType}
              raw={data.position.received}
            />
          </p>
        </div>
      </div>

      <div tw="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat
          label="Investment Value"
          value={
            <TokenValue
              coinType={outputCoinType}
              // TODO: need price
              raw={data.position.received}
            />
          }
        />
        <Stat
          label="Remaining Deposit"
          value={
            <TokenAmount
              coinType={outputCoinType}
              raw={data.position.deposit}
            />
          }
        />
        <Stat
          label="Amount Per Trade"
          // TODO
          value={
            inputCoin
              ? `${bnToApproximateDecimal(
                  data.position.amount_per_trade,
                  inputCoin.decimals
                )} ${inputCoin.symbol}`
              : '---'
          }
        />
        <Stat
          label="Schedule"
          value={formatSchedule(data.position.frequency)}
        />
        <Stat
          label="Latest Purchase"
          value={data.position.last_trade_time?.toLocaleString() || '---'}
        />
        <Stat
          label="Next Purchase"
          value={
            data.position.last_trade_time?.toLocaleString() ? 'todo' : 'Pending'
          }
        />
      </div>

      <div tw="mt-6 grid sm:grid-cols-2 gap-3">
        <div>
          <p tw="font-bold text-sm mb-1">Investment Progress</p>
          <PositionProgressBar
            coinType={inputCoinType}
            originalAmount={event.deposit_amount}
            remainingAmount={data.position.deposit}
          />
        </div>
        <div tw="grid grid-cols-2 sm:(flex justify-end) gap-3">
          <Button
            type="button"
            tw="py-3 text-sm rounded-md"
            variant="secondary"
            onClick={handleWithdrawFunds}
            disabled={data.position.received.isZero()}
          >
            Withdraw {outputCoin?.symbol || 'Funds'}
          </Button>
          <a
            href={getExplorerUrl(event.position_id)}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              type="button"
              tw="w-full py-3 text-sm rounded-md"
              variant="secondary"
            >
              View in Explorer
            </Button>
          </a>
        </div>
      </div>

      {IS_DEV && (
        <div tw="mt-6 grid sm:grid-cols-2 gap-3">
          <Button
            type="button"
            tw="py-3 text-sm rounded-md bg-red-500"
            variant="secondary"
            onClick={handleExecutePosition}
          >
            Execute
          </Button>
        </div>
      )}
    </div>
  );
}

const PositionList: React.FC = ({ ...props }) => {
  const { data, isLoading } = usePositionsList();

  if (isLoading || !data) {
    return <Loading.Spinner />;
  }

  if (!data.length) {
    return <p tw="px-6">No positions yet.</p>;
  }

  return (
    <div tw="grid grid-cols-1 gap-12" {...props}>
      {data.map(({ event }) => (
        <PositionOverview key={event.event.position_id} event={event} />
      ))}
    </div>
  );
};

export default PositionList;
