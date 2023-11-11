import { QUERY_KEYS } from '@/util/constants';
import { useQuery } from '@tanstack/react-query';
import useAssetsList from './useAssetsList';
import { priceUsdToDecimal } from '@crumb-finance/sdk';

export default function useCoinPrice(coinType: string) {
  const { data: assets } = useAssetsList();

  return useQuery({
    queryKey: [QUERY_KEYS.COIN_PRICE, assets, coinType],
    queryFn: async () => {
      const asset = assets?.find((a) => a.coinType === coinType);
      if (!asset) {
        throw new Error(`Asset ${coinType} not found`);
      }

      return priceUsdToDecimal(asset.asset.price_usd);
    },
  });
}
