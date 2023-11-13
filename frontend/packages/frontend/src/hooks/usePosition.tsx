'use client';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/util/constants';
import { useCrumb } from '@/context/RpcContext';

export default function usePosition(positionId: string) {
  const crumb = useCrumb();

  return useQuery({
    queryKey: [QUERY_KEYS.POSITION, positionId],
    queryFn: () => crumb.getPosition(positionId),
  });
}
