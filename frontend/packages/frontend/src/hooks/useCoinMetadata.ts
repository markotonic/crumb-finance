import { useRpc } from '@/context/RpcContext';
import { QUERY_KEYS, SUI_COIN_TYPE } from '@/util/constants';
import { CoinMetadata } from '@mysten/sui.js/dist/cjs/client';
import { useQuery } from '@tanstack/react-query';

function isSuicoin(coinType: string) {
  return coinType === SUI_COIN_TYPE;
}

function addSuiIconToMeta(m: CoinMetadata) {
  return {
    ...m,
    iconUrl:
      'https://s3.coinmarketcap.com/static-gravity/image/5bd0f43855f6434386c59f2341c5aaf0.png',
  } as CoinMetadata;
}

export default function useCoinMetadata(coinType: string) {
  const provider = useRpc();

  return useQuery({
    queryKey: [QUERY_KEYS.COIN_METADATA, coinType],
    queryFn: async () => {
      const meta = await provider.getCoinMetadata({
        coinType,
      });

      if (!meta) {
        throw new Error(`No metadata for coin type: ${coinType}`);
      }

      if (isSuicoin(coinType)) {
        return addSuiIconToMeta(meta);
      }

      return meta;
    },
  });
}
