import pool from '../config/db.js';

/**
 * Returns the 2-digit Financial Year (e.g., April 2026 -> '26', Feb 2027 -> '26')
 * In India, FY starts April 1st and ends March 31st.
 */
export const getFinancialYearCode = (date = new Date()) => {
  const d = new Date(date);
  const month = d.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec
  const year = d.getFullYear();
  const fyStartYear = month >= 3 ? year : year - 1;
  return String(fyStartYear).slice(-2); // '26'
};

/**
 * Generate sequential Estimate Number (e.g., HE26001)
 */
export const generateEstimateNumber = async (date = new Date()) => {
  const fyCode = getFinancialYearCode(date);
  const prefix = `HE${fyCode}`;

  const [rows] = await pool.query(
    'SELECT quotation_number FROM quotations WHERE quotation_number LIKE ? ORDER BY quotation_number DESC LIMIT 1',
    [`${prefix}%`]
  );

  if (rows.length === 0) {
    return `${prefix}001`;
  }

  // Extract trailing digits
  const lastNumStr = rows[0].quotation_number.replace(prefix, '');
  const lastNum = parseInt(lastNumStr, 10);
  const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

/**
 * Generate sequential Invoice Number (e.g., HIN26001)
 */
export const generateInvoiceNumber = async (date = new Date()) => {
  const fyCode = getFinancialYearCode(date);
  const prefix = `HIN${fyCode}`;

  const [rows] = await pool.query(
    'SELECT invoice_number FROM quotations WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1',
    [`${prefix}%`]
  );

  if (rows.length === 0) {
    return `${prefix}001`;
  }

  const lastNumStr = rows[0].invoice_number.replace(prefix, '');
  const lastNum = parseInt(lastNumStr, 10);
  const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

/**
 * Generate sequential Receipt Number for an invoice (e.g., HIN26001-R1, HIN26001-R2 or HR26001)
 */
export const generateReceiptNumber = async (invoiceNumber, date = new Date()) => {
  if (invoiceNumber) {
    const [rows] = await pool.query(
      'SELECT receipt_number FROM payments WHERE invoice_number = ? ORDER BY created_at DESC',
      [invoiceNumber]
    );

    const count = rows.length + 1;
    return `${invoiceNumber}-R${count}`;
  }

  // Fallback to HR26001
  const fyCode = getFinancialYearCode(date);
  const prefix = `HR${fyCode}`;

  const [rows] = await pool.query(
    'SELECT receipt_number FROM payments WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1',
    [`${prefix}%`]
  );

  if (rows.length === 0) {
    return `${prefix}001`;
  }

  const lastNumStr = rows[0].receipt_number.replace(prefix, '');
  const lastNum = parseInt(lastNumStr, 10);
  const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

