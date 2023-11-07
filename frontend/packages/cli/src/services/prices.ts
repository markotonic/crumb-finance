import axios from 'axios';

const coingeckoClient = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3/',
});

export const getCoinGeckoPrice = async (asset: string) => {
  return coingeckoClient
    .get('simple/price', {
      params: {
        ids: asset,
        vs_currencies: 'usd',
      },
    })
    .then((res) => res.data[asset]['usd']) as unknown as number;
};
