/**
 * Convert a number to Indian Currency Words format
 * e.g., 200000 -> "Indian Rupees Two Lakhs Only"
 *       80000  -> "Indian Rupees Eighty Thousand Only"
 *       180000 -> "Indian Rupees One Lakh Eighty Thousand Only"
 */
export const numberToIndianWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  num = Math.round(Number(num));
  if (num === 0) return 'Indian Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertTwoDigits = (n) => {
    if (n < 20) return singleDigits[n];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit ? ' ' + singleDigits[unit] : '');
  };

  const convertThreeDigits = (n) => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
    }
    if (rest > 0) {
      res += (hundred > 0 ? ' ' : '') + convertTwoDigits(rest);
    }
    return res;
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh' + (lakh > 1 ? 's ' : ' ');
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigits(remainder);
  }

  return `Indian Rupees ${words.trim()} Only`;
};

