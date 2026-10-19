import pool from '../config/db.js';

// 1. Record a New Payment for a Project
export const recordPayment = async (paymentData, userId) => {
  const {
    project_id,
    amount_paid,
    payment_date = new Date().toISOString().slice(0, 10),
    payment_method = 'UPI',
    transaction_reference = null,
    notes = null
  } = paymentData;

  // Check if project exists and get its client_id
  const [projectRows] = await pool.query('SELECT id, client_id, total_cost FROM projects WHERE id = ?', [project_id]);
  if (projectRows.length === 0) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const clientId = projectRows[0].client_id;

  // Insert Payment
  await pool.query(
    `INSERT INTO payments 
      (project_id, client_id, amount_paid, payment_date, payment_method, transaction_reference, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [project_id, clientId, amount_paid, payment_date, payment_method, transaction_reference, notes, userId]
  );

  const [row] = await pool.query('SELECT * FROM payments ORDER BY created_at DESC LIMIT 1');
  return row[0];
};

// 2. Get All Payments (with filters by project or client)
export const getPayments = async ({ project_id, client_id }) => {
  let query = `
    SELECT 
      pm.*,
      p.title AS project_title,
      c.name AS client_name,
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
  return rows;
};

// 3. Get Single Payment by ID
export const getPaymentById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
      pm.*,
      p.title AS project_title,
      c.name AS client_name,
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

  return rows[0];
};

// 4. Delete Payment Record
export const deletePayment = async (id) => {
  const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return { message: 'Payment record deleted successfully' };
};

// 5. Overall Financial Summary (Dashboard Metrics)
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
