'use client';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/util/constants';
import { useCrumb } from '@/context/RpcContext';

export default function useAssetsList() {
  const crumb = useCrumb();

  return useQuery({
    queryKey: [QUERY_KEYS.ASSETS_LIST],
    queryFn: async () => {
      return crumb.getAssets();
    },
  });
}
