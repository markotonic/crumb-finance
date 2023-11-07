import BN from 'bn.js';
import { useQuery } from '@tanstack/react-query';
import { useWalletKit } from '@mysten/wallet-kit';
import { CoinStruct } from '@mysten/sui.js/dist/cjs/client';

import { useRpc } from '../context/RpcContext';
import { QUERY_KEYS } from '../util/constants';

/**
 * helps us smash coins of same type together before doing deposit
 */
type GroupedCoin = {
  coinType: string;
  coins: CoinStruct[];
  totalBalanceBn: BN;
};

function groupCoins(coins: CoinStruct[]) {
  const groupedCoins: GroupedCoin[] = [];

  for (const coin of coins) {
    const { coinType } = coin;

    const existing = groupedCoins.find((c) => c.coinType === coinType);

    const balanceBn = new BN(coin.balance);
    if (existing) {
      existing.coins.push(coin);
      existing.totalBalanceBn = existing.totalBalanceBn.add(balanceBn);
    } else {
      groupedCoins.push({
        coinType,
        coins: [coin],
        totalBalanceBn: balanceBn,
      });
    }
  }

  return groupedCoins;
}

export function useOwnedCoins({
  address: _address,
  cursor = undefined,
  limit = 50,
}: {
  address?: string;
  cursor?: string;
  limit?: number;
} = {}) {
  const { currentAccount } = useWalletKit();
  const provider = useRpc();

  return useQuery({
    queryKey: [QUERY_KEYS.OWNED_COINS, currentAccount?.address],
    queryFn: async () => {
      const address = _address || currentAccount?.address;

      if (!address) return [];

      const { data } = await provider.getCoins({
        owner: address,
        cursor,
        limit,
      });

      return data;
    },
  });
}
