import axios from 'axios';

const coingeckoClient = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3/',
});

export const getCoinGeckoPrice = async (_symbol: string) => {
  // it's always lowercase in the response
  const symbol = _symbol.toLowerCase();

  if (symbol === 'usdc') return 1;

  const resp = await coingeckoClient.get('simple/price', {
    params: {
      ids: symbol,
      vs_currencies: 'usd',
    },
  });

  return resp.data[symbol]['usd'] as unknown as number;
};
