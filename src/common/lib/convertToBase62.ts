const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function convertToBase62(num: number): string {
  if (num === 0) return ALPHABET[0];

  let result = '';
  let n = num;

  while (n > 0) {
    result = ALPHABET[n % 62] + result;
    n = Math.floor(n / 62);
  }

  return result;
}
