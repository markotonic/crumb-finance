import BN from 'bn.js';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/util/constants';
import { useCrumb } from '@/context/RpcContext';
import { useOwnedCoins } from './useOwnedCoins';
import { bnToApproximateDecimal } from '@crumb-finance/sdk';

export function useWalletBalance(coinType: string) {
  const { data: ownedCoins } = useOwnedCoins();
  const crumb = useCrumb();

  return useQuery({
    queryKey: [QUERY_KEYS.WALLET_BALANCE, coinType],
    queryFn: async () => {
      const metadata = await crumb.getCoinMetadata(coinType);

      const balanceBn =
        ownedCoins
          ?.filter((c) => c.coinType === coinType)
          .reduce((acc, cur) => acc.add(new BN(cur.balance)), new BN(0)) ||
        new BN(0);

      const coinIds =
        ownedCoins
          ?.filter((c) => c.coinType === coinType)
          .map((c) => c.coinObjectId) ?? [];

      return {
        balanceBn,
        balanceDecimal: bnToApproximateDecimal(balanceBn, metadata.decimals),
        coinIds,
      };
    },
  });
}
