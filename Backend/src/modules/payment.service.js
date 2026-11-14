import pool from '../config/db.js';
import { generateReceiptNumber } from '../utils/financeNumbering.js';
import { numberToIndianWords } from '../utils/numberToWords.js';
import { logAudit } from '../utils/auditLogger.js';

// 1. Record a New Payment for a Project
export const recordPayment = async (paymentData, userId) => {
  const {
    project_id,
    amount_paid,
    payment_date = new Date().toISOString().slice(0, 10),
    payment_method = 'UPI',
    transaction_reference = null,
    invoice_number = null,
    invoice_amount = null,
    payment_status = null,
    notes = null
  } = paymentData;

  // Check if project exists and get its client_id
  const [projectRows] = await pool.query('SELECT id, client_id, total_cost, title FROM projects WHERE id = ?', [project_id]);
  if (projectRows.length === 0) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const project = projectRows[0];
  const clientId = project.client_id;
  const projectTotal = invoice_amount ? Number(invoice_amount) : Number(project.total_cost || 0);

  // Auto-generate official Receipt Number (e.g., HIN26001-R1 or HR26001)
  const receiptNumber = paymentData.receipt_number || await generateReceiptNumber(invoice_number, payment_date);

  // Calculate prior payments to determine part or full payment status
  const [pastPayments] = await pool.query(
    'SELECT COALESCE(SUM(amount_paid), 0) AS total_past FROM payments WHERE project_id = ?',
    [project_id]
  );
  const totalPaidSoFar = Number(pastPayments[0].total_past) + Number(amount_paid);

  let finalPaymentStatus = payment_status;
  if (!finalPaymentStatus) {
    finalPaymentStatus = (projectTotal > 0 && totalPaidSoFar >= projectTotal) ? 'Full Payment' : 'Part Payment';
  }

  // Ensure valid recorded_by
  let activeUserId = userId;
  if (!activeUserId) {
    const [uRows] = await pool.query('SELECT id FROM users LIMIT 1');
    if (uRows.length > 0) activeUserId = uRows[0].id;
  }

  // Insert Payment
  await pool.query(
    `INSERT INTO payments 
      (receipt_number, invoice_number, project_id, client_id, amount_paid, invoice_amount, payment_status, payment_date, payment_method, transaction_reference, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receiptNumber,
      invoice_number || null,
      project_id,
      clientId,
      amount_paid,
      projectTotal,
      finalPaymentStatus,
      payment_date,
      payment_method,
      transaction_reference,
      notes,
      activeUserId
    ]
  );

  const [row] = await pool.query('SELECT * FROM payments WHERE receipt_number = ? ORDER BY created_at DESC LIMIT 1', [receiptNumber]);
  const payment = row[0];

  // Audit Log
  await logAudit({
    actor_user_id: userId,
    action: 'PAYMENT_RECORDED',
    entity_type: 'payment',
    entity_id: receiptNumber,
    summary: `Payment Receipt ${receiptNumber} recorded for ₹ ${Number(amount_paid).toLocaleString('en-IN')} (${finalPaymentStatus})`,
    metadata: { receipt_number: receiptNumber, amount_paid, invoice_number, payment_method }
  });

  return getPaymentById(payment.id);
};

// 2. Get All Payments (with filters by project or client)
export const getPayments = async ({ project_id, client_id }) => {
  let query = `
    SELECT 
      pm.*,
      p.title AS project_title,
      p.total_cost AS project_total_cost,
      c.name AS client_name,
      c.company_name AS client_company,
      c.email AS client_email,
      c.phone AS client_phone,
      c.billing_address AS client_billing_address,
      u.full_name AS recorded_by_name
    FROM payments pm
    JOIN projects p ON pm.project_id = p.id
    JOIN clients c ON pm.client_id = c.id
    LEFT JOIN users u ON pm.recorded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND pm.project_id = ?';
    params.push(project_id);
  }

  if (client_id) {
    query += ' AND pm.client_id = ?';
    params.push(client_id);
  }

  query += ' ORDER BY pm.payment_date DESC, pm.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows.map(p => ({
    ...p,
    amount_in_words: numberToIndianWords(p.amount_paid)
  }));
};

// 3. Get Single Payment by ID
export const getPaymentById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
      pm.*,
      p.title AS project_title,
      p.total_cost AS project_total_cost,
      c.name AS client_name,
      c.company_name AS client_company,
      c.email AS client_email,
      c.phone AS client_phone,
      c.billing_address AS client_billing_address,
      u.full_name AS recorded_by_name
    FROM payments pm
    JOIN projects p ON pm.project_id = p.id
    JOIN clients c ON pm.client_id = c.id
    LEFT JOIN users u ON pm.recorded_by = u.id
    WHERE pm.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const payment = rows[0];
  payment.amount_in_words = numberToIndianWords(payment.amount_paid);
  return payment;
};

// 4. Update Payment Record
export const updatePayment = async (id, updateData, userId) => {
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updateData)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'client_id' && key !== 'project_id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  return await getPaymentById(id);
};

// 5. Delete Payment Record
export const deletePayment = async (id, userId) => {
  const [rows] = await pool.query('SELECT receipt_number, amount_paid FROM payments WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const receiptNum = rows[0].receipt_number;
  await pool.query('DELETE FROM payments WHERE id = ?', [id]);

  await logAudit({
    actor_user_id: userId,
    action: 'PAYMENT_DELETED',
    entity_type: 'payment',
    entity_id: receiptNum,
    summary: `Deleted payment receipt ${receiptNum}`,
    metadata: { receipt_number: receiptNum }
  });

  return { message: 'Payment record deleted successfully' };
};

// 6. Overall Financial Summary (Dashboard Metrics)
export const getFinancialSummary = async () => {
  // Total Project Value
  const [totalCostRows] = await pool.query('SELECT COALESCE(SUM(total_cost), 0) AS total_project_value FROM projects');
  
  // Total Collected Amount
  const [totalPaidRows] = await pool.query('SELECT COALESCE(SUM(amount_paid), 0) AS total_collected FROM payments');

  const totalProjectValue = Number(totalCostRows[0].total_project_value);
  const totalCollected = Number(totalPaidRows[0].total_collected);
  const totalPendingDue = totalProjectValue - totalCollected;

  return {
    total_project_value: totalProjectValue,
    total_collected: totalCollected,
    total_pending_due: totalPendingDue
  };
};
