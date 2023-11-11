import { useCrumb } from '@/context/RpcContext';
import { QUERY_KEYS, SUI_COIN_TYPE, SUI_ICON_URL } from '@/util/constants';
import { CoinMetadata } from '@mysten/sui.js/dist/cjs/client';
import { useQuery } from '@tanstack/react-query';

function isSuicoin(coinType: string) {
  return coinType === SUI_COIN_TYPE;
}

function addSuiIconToMeta(m: CoinMetadata) {
  return {
    ...m,
    iconUrl: SUI_ICON_URL,
  } as CoinMetadata;
}

export default function useCoinMetadata(coinType: string) {
  const crumb = useCrumb(); // use the crumb client for cache

  return useQuery({
    queryKey: [QUERY_KEYS.COIN_METADATA, coinType],
    queryFn: async () => {
      const meta = await crumb.getCoinMetadata(coinType);

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
