import { sleep } from '@/util';
import { QUERY_KEYS } from '@/util/constants';
import { useQuery } from '@tanstack/react-query';

export default function useCoinPrice(symbol: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.COIN_PRICE, symbol],
    queryFn: async () => {
      await sleep(Math.random() * 2_000);
      return Math.random() * 100;
    },
  });
}
