'use client';
import { useQuery } from '@tanstack/react-query';
import { useWalletKit } from '@mysten/wallet-kit';

import { QUERY_KEYS } from '@/util/constants';
import { useCrumb } from '@/context/RpcContext';

// TODO: fetch all pages
export default function usePositionsList() {
  const { currentAccount } = useWalletKit();
  const crumb = useCrumb();

  return useQuery({
    queryKey: [QUERY_KEYS.POSITIONS_LIST, currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount) return;

      return crumb.getOwnedPositions(currentAccount.address);
    },
  });
}
