import pool from '../config/db.js';

// Helper to normalize phone (remove spaces, dashes)
const normalizePhone = (phone) => phone.replace(/\D/g, '');

// 1. Create a new Lead
export const createLead = async (leadData, userId) => {
  const {
    lead_type = 'Client', // 'Student' or 'Client'
    name,
    phone,
    email = null,
    company_name = null,
    requirement,
    service_interest = null, // For Students: 'Data Science', 'FullStack Development', 'Digital Marketing'
    source = 'Direct',
    estimated_budget = null,
    priority = 'Normal',
    internal_notes = null
  } = leadData;

  const normalized_phone = normalizePhone(phone);

  const [result] = await pool.query(
    `INSERT INTO leads 
      (lead_type, name, phone, normalized_phone, email, company_name, requirement, service_interest, source, estimated_budget, priority, internal_notes, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead_type,
      name,
      phone,
      normalized_phone,
      email,
      company_name,
      requirement,
      service_interest,
      source,
      estimated_budget,
      priority,
      internal_notes,
      userId, // default assign to the creator
      userId
    ]
  );

  const [createdRow] = await pool.query('SELECT * FROM leads WHERE id = (SELECT id FROM leads ORDER BY created_at DESC LIMIT 1)');
  return createdRow[0];
};

// 2. Get all Leads (with search & filter)
export const getLeads = async ({ status, search, lead_type }) => {
  let query = `
    SELECT l.*, u.full_name as assigned_to_name 
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE 1=1
  `;
  const params = [];

  if (lead_type) {
    query += ' AND l.lead_type = ?';
    params.push(lead_type);
  }

  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.company_name LIKE ? OR l.service_interest LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY l.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get single Lead by ID
export const getLeadById = async (id) => {
  const [rows] = await pool.query(
    `SELECT l.*, u.full_name as assigned_to_name 
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return rows[0];
};

// 4. Update Lead Details
export const updateLead = async (id, updateData) => {
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updateData)) {
    if (key === 'phone') {
      fields.push('phone = ?', 'normalized_phone = ?');
      values.push(val, normalizePhone(val));
    } else if (key !== 'id' && key !== 'created_at' && key !== 'lead_number') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) {
    return await getLeadById(id);
  }

  values.push(id);
  await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);

  return await getLeadById(id);
};

// 5. Update Lead Status
export const updateLeadStatus = async (id, { status, lost_reason = null, on_hold_reason = null }) => {
  if (status === 'Lost' && !lost_reason) {
    const error = new Error('lost_reason is required when marking a lead as Lost');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (status === 'On Hold' && !on_hold_reason) {
    const error = new Error('on_hold_reason is required when marking a lead On Hold');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  await pool.query(
    'UPDATE leads SET status = ?, lost_reason = ?, on_hold_reason = ? WHERE id = ?',
    [status, lost_reason, on_hold_reason, id]
  );

  return await getLeadById(id);
};

// 6. Delete Lead
export const deleteLead = async (id) => {
  const [result] = await pool.query('DELETE FROM leads WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return { message: 'Lead deleted successfully' };
};
