import BN from 'bn.js';

/**
 * Analogous to Number.toFixed() for BN values. Example
 *
 * @example bnToFixed(new BN(123), 2, 5) === '1.23000'; // true
 *
 * @param {BN} num on-chain integer representation
 * @param {number} decimals number of decimals
 * @param {number} precision optional precision, same as in Number.toFixed()
 */
export const bnToFixed = (
  num: BN,
  decimals: number,
  precision?: number
): string => {
  const _num = num.toString();
  if (!decimals) return _num;

  const wholePart = _num.substring(0, _num.length - decimals) || '0';
  const fracPrecision =
    typeof precision === 'number'
      ? Math.max(0, Math.min(precision, decimals))
      : decimals;
  const fracPart = _num
    .substring(_num.length - decimals)
    .padStart(decimals, '0')
    .substring(0, fracPrecision);

  if (fracPrecision === 0) {
    return wholePart;
  } else if (fracPrecision) {
    return `${wholePart}.${fracPart.substring(0, fracPrecision)}`;
  } else {
    // chop off trailing 0s
    return `${wholePart}.${fracPart}`.replace(/\.?0+$/, '');
  }
};

/**
 * Turn a decimal number into its on-chain integer representation.
 *
 * @example toDecimalPaddedString('1.23', 2) === '123'
 *
 * @param val A number as a string
 * @param decimals Number of decimals
 * @returns BN of the number
 */
export const toDecimalPaddedString = (
  val: string,
  decimals?: number
): string => {
  if (typeof decimals === 'undefined') return val;

  const [wholePart, fracPart = ''] = val.split('.');
  const res = `${wholePart}${fracPart.padEnd(decimals, '0').slice(0, decimals)}`
    .replace(/^0+/, '')
    .padStart(1, '0'); // at least 0

  return res;
};

export const ZERO = new BN(0);

export const denomination = (decimals: number) => {
  return new BN(decimals).pow(new BN(10));
};

export const roundDownTo = (v: BN, nearest: BN) => {
  return v.div(nearest).mul(nearest);
};

export const floorToDecimals = (v: BN, decimals: number) => {
  if (decimals < 1) {
    throw new Error('decimals must be positive');
  }
  const mask = denomination(decimals);
  return v.div(mask).mul(mask);
};

export const floorToBn = (v: BN, closest: BN) => {
  return v.div(closest).mul(closest);
};

export const bnToApproximateDecimal = (
  v: BN,
  decimals: number,
  precision?: number
) => {
  return parseFloat(bnToFixed(v, decimals, precision));
};

export const decimalToBn = (price: number | string, decimals: number) => {
  return new BN(toDecimalPaddedString(price.toString(), decimals));
};

export const priceUsdBnToDecimal = (price: BN, precision?: number) => {
  // USDC has 6 decimals
  return bnToApproximateDecimal(price, 6, precision);
};

export const priceUsdDecimalToBn = (price: number) => {
  return decimalToBn(price, 6);
};
