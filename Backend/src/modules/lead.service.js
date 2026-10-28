import pool from '../config/db.js';

// Helper to normalize phone (remove spaces, dashes, leading country codes)
export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
};

// 1. Create a new Lead
export const createLead = async (leadData, userId) => {
  const {
    lead_type = 'Client',
    name,
    phone,
    alternate_phone = null,
    email = null,
    company_name = null,
    website = null,
    designation = null,
    city = null,
    requirement,
    service_interest = null,
    source = 'Direct',
    source_details = null,
    estimated_budget = null,
    expected_decision_date = null,
    domain_available = 'Unknown',
    hosting_available = 'Unknown',
    status = 'New',
    priority = 'Normal',
    internal_notes = null,
    assigned_to = null,
    duplicate_override = 0
  } = leadData;

  const normalized_phone = normalizePhone(phone);
  const assigneeId = assigned_to || userId;

  await pool.query(
    `INSERT INTO leads 
      (lead_type, name, phone, normalized_phone, alternate_phone, email, company_name, website, designation, city, 
       requirement, service_interest, source, source_details, estimated_budget, expected_decision_date, 
       domain_available, hosting_available, status, priority, internal_notes, duplicate_override, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead_type,
      name,
      phone,
      normalized_phone,
      alternate_phone || null,
      email || null,
      company_name || null,
      website || null,
      designation || null,
      city || null,
      requirement,
      service_interest || null,
      source || 'Direct',
      source_details || null,
      estimated_budget ? Number(estimated_budget) : null,
      expected_decision_date || null,
      ['Yes', 'No', 'Unknown'].includes(domain_available) ? domain_available : 'Unknown',
      ['Yes', 'No', 'Unknown'].includes(hosting_available) ? hosting_available : 'Unknown',
      status || 'New',
      priority || 'Normal',
      internal_notes || null,
      duplicate_override ? 1 : 0,
      assigneeId,
      userId
    ]
  );

  const [createdRow] = await pool.query(
    `SELECT l.*, u.full_name as assigned_to_name, creator.full_name as created_by_name
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     LEFT JOIN users creator ON l.created_by = creator.id
     WHERE l.id = (SELECT id FROM leads ORDER BY created_at DESC LIMIT 1)`
  );
  return createdRow[0];
};

// 2. Get all Leads (with search & filter)
export const getLeads = async ({ status, search, lead_type, assigned_to, priority }) => {
  let query = `
    SELECT l.*, u.full_name as assigned_to_name, creator.full_name as created_by_name 
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN users creator ON l.created_by = creator.id
    WHERE 1=1
  `;
  const params = [];

  if (lead_type) {
    query += ' AND l.lead_type = ?';
    params.push(lead_type);
  }

  if (status && status !== 'All') {
    query += ' AND l.status = ?';
    params.push(status);
  }

  if (assigned_to && assigned_to !== 'All') {
    query += ' AND l.assigned_to = ?';
    params.push(assigned_to);
  }

  if (priority && priority !== 'All') {
    query += ' AND l.priority = ?';
    params.push(priority);
  }

  if (search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.company_name LIKE ? OR l.service_interest LIKE ? OR l.requirement LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY l.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get single Lead by ID
export const getLeadById = async (id) => {
  const [rows] = await pool.query(
    `SELECT l.*, u.full_name as assigned_to_name, creator.full_name as created_by_name 
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     LEFT JOIN users creator ON l.created_by = creator.id
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
    } else if (
      key !== 'id' && 
      key !== 'created_at' && 
      key !== 'updated_at' && 
      key !== 'lead_number' && 
      key !== 'assigned_to_name' && 
      key !== 'created_by_name'
    ) {
      fields.push(`${key} = ?`);
      values.push(val === '' ? null : val);
    }
  }

  if (fields.length === 0) {
    return await getLeadById(id);
  }

  values.push(id);
  await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);

  return await getLeadById(id);
};

// 5. Update Lead Status (with Lost reason and On Hold reason + Revisit date)
export const updateLeadStatus = async (id, { status, lost_reason = null, on_hold_reason = null, revisit_date = null }) => {
  const finalLostReason = status === 'Lost' ? (lost_reason || 'Not specified') : null;
  const finalOnHoldReason = status === 'On Hold' ? (on_hold_reason || 'Not specified') : null;
  const finalRevisitDate = status === 'On Hold' ? (revisit_date || null) : null;

  await pool.query(
    `UPDATE leads 
     SET status = ?, 
         lost_reason = ?, 
         on_hold_reason = ?, 
         revisit_date = ? 
     WHERE id = ?`,
    [status, finalLostReason, finalOnHoldReason, finalRevisitDate, id]
  );

  return await getLeadById(id);
};

// 6. Check Duplicate Phone across Leads and Clients
export const checkDuplicatePhone = async (phone, excludeLeadId = null) => {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 5) {
    return { isDuplicate: false, matches: [] };
  }

  const last10 = normalized.slice(-10);

  // 1. Check in leads table
  let leadQuery = `
    SELECT id, lead_number, name, company_name, phone, status 
    FROM leads 
    WHERE normalized_phone = ? OR normalized_phone LIKE ?
  `;
  const leadParams = [normalized, `%${last10}`];
  if (excludeLeadId) {
    leadQuery += ' AND id != ?';
    leadParams.push(excludeLeadId);
  }

  const [leadMatches] = await pool.query(leadQuery, leadParams);

  // 2. Check in clients table
  const [clientMatches] = await pool.query(
    'SELECT id, client_number, name, company_name, phone FROM clients WHERE normalized_phone = ? OR normalized_phone LIKE ?',
    [normalized, `%${last10}`]
  );

  const matches = [
    ...leadMatches.map((l) => ({ type: 'lead', ...l })),
    ...clientMatches.map((c) => ({ type: 'client', ...c }))
  ];

  return {
    isDuplicate: matches.length > 0,
    matches
  };
};

// 7. Get Team Members / Active Assignees
export const getAssignees = async () => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email FROM users WHERE is_active = 1 ORDER BY full_name ASC'
  );
  return rows;
};

// 8. Delete Lead
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
