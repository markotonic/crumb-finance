'use client';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/util/constants';
import { useRpc } from '@/context/RpcContext';
import { SuiClient, SuiObjectResponse } from '@mysten/sui.js/dist/cjs/client';
import {
  Position,
  PositionTypeArgs,
  RawPosition,
  toPosition,
} from '@crumb-finance/sdk';

function extractPosition(rawObject: SuiObjectResponse): Position {
  if (rawObject.data && rawObject.data.content?.dataType === 'moveObject') {
    const raw = rawObject.data.content.fields as unknown as RawPosition;
    return toPosition(raw);
  } else {
    throw new Error('Invalid position object ' + rawObject.data?.objectId);
  }
}

function extractPositionTypeArgs(obj: SuiObjectResponse) {
  const rawType = obj.data?.type;
  if (rawType) {
    const match = /<([^,]+),\s*([^>]+)>/.exec(rawType);
    if (match && match[1] && match[2]) {
      return [match[1], match[2]] as PositionTypeArgs;
    }
  }
  throw new Error('Invalid position object ' + obj.data?.objectId);
}

export async function fetchPosition(provider: SuiClient, positionId: string) {
  const position = await provider.getObject({
    id: positionId,
    options: {
      showContent: true,
      showType: true,
    },
  });

  return {
    position: extractPosition(position),
    typeArgs: extractPositionTypeArgs(position),
  };
}

export default function usePosition(positionId: string) {
  const provider = useRpc();

  return useQuery({
    queryKey: [QUERY_KEYS.POSITION, positionId],
    queryFn: () => fetchPosition(provider, positionId),
  });
}
