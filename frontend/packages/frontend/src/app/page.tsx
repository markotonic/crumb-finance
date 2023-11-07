/** @jsxImportSource @emotion/react */
'use client';
import 'twin.macro';

import PositionCreateForm from '@/components/PositionCreateForm';
import PositionList from '@/components/PositionList';
import usePositionsList from '@/hooks/usePositionsList';
import { CDot } from '@/components/Shape';
import { useQueries } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/util/constants';
import { fetchPosition } from '@/hooks/usePosition';
import { useRpc } from '@/context/RpcContext';
import { useMemo } from 'react';
import { bnToApproximateDecimal } from '@/util/math';
import useAssetsList from '@/hooks/useAssetsList';

function PortfolioValue() {
  const provider = useRpc();
  const { data: positionEvents } = usePositionsList();
  const { data: assets } = useAssetsList();

  const positions = useQueries({
    queries:
      positionEvents?.map(({ event }) => ({
        queryKey: [QUERY_KEYS.POSITION, event.event.position_id],
        queryFn: () => fetchPosition(provider, event.event.position_id),
      })) ?? [],
  });

  const { investments, deposits } = useMemo(() => {
    let totalInvestment = 0;
    let remainingDeposits = 0;

    for (const { data } of positions) {
      if (data) {
        const {
          position,
          typeArgs: [inputTokenType, outputTokenType],
        } = data;
        const investment = position.received;
        const deposit = position.deposit;

        // TODO: hardcoded for SUI
        totalInvestment += bnToApproximateDecimal(investment, 9);
        remainingDeposits += bnToApproximateDecimal(deposit, 9);

        // TODO: prices...
      }
    }

    return {
      investments: totalInvestment,
      deposits: remainingDeposits,
    };
  }, [positions]);

  return (
    <div tw="flex items-center gap-6">
      <div>
        <p tw="text-sm font-bold">Portfolio Value</p>
        <p tw="font-medium">${(investments + deposits).toFixed(2)}</p>
      </div>
      <div>
        <p tw="text-sm font-bold">Investments</p>
        <p tw="font-medium">${investments.toFixed(2)}</p>
      </div>
      <div>
        <p tw="text-sm font-bold">Deposits</p>
        <p tw="font-medium">${deposits.toFixed(2)}</p>
      </div>
    </div>
  );
}

const App = () => {
  const { data } = usePositionsList();

  return (
    <div tw="flex flex-col items-center justify-center">
      <div tw="mt-24 flex flex-col mx-auto max-w-2xl justify-center h-full gap-6">
        <div tw="flex flex-col lg:flex-row lg:items-center gap-6 px-6 justify-between">
          <h1 tw="text-2xl font-bold">Invest</h1>
          <PortfolioValue />
        </div>

        <div tw="grid sm:grid-cols-2 border bg-cyan-50 border-black rounded-2xl overflow-hidden divide-y sm:(divide-y-0 divide-x) divide-black shadow-hard">
          <div tw="p-6 flex flex-col items-stretch">
            <h1 tw="text-xl font-medium mx-3 text-center">
              What is Dollar Cost Averaging (DCA)?
            </h1>

            <div tw="flex flex-col items-stretch justify-end gap-6 mt-6">
              <div tw="flex items-start gap-3">
                <div tw="pt-2.5">
                  <CDot />
                </div>
                <div>
                  <p tw="text-base font-bold">Invest over time</p>
                  <p tw="mt-1.5 text-sm font-medium opacity-80">
                    Set it and forget it. Invest at regular intervals without
                    worrying about timing the market.
                  </p>
                </div>
              </div>
              <div tw="flex items-start gap-3">
                <div tw="pt-2.5">
                  <CDot />
                </div>
                <div>
                  <p tw="text-base font-bold">Mitigate risk, capture upside</p>
                  <p tw="mt-1.5 text-sm font-medium opacity-80">
                    Spreading out your investment smooths out volatility while
                    tracking the long term trend of the industry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div tw="p-3">
            <PositionCreateForm />
          </div>
        </div>

        {!!data?.length && (
          <div tw="mb-24">
            <h1 tw="text-2xl font-bold m-6 mt-24">Positions</h1>
            <PositionList />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
