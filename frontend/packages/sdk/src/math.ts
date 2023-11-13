import BN from 'bn.js';

export function getTradeOutAmount(
  inputPriceUsdBn: BN,
  outputPriceUsdBn: BN,
  inputAmount: BN
) {
  return inputAmount.mul(inputPriceUsdBn).div(outputPriceUsdBn);
}
