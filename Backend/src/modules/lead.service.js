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
export const getLeads = async ({ status, search, lead_type, assigned_to, priority, follow_up_filter, sort_by = 'created_at', sort_order = 'DESC' }) => {
  let query = `
    SELECT l.*, 
           u.full_name as assigned_to_name, 
           creator.full_name as created_by_name,
           c.client_number as converted_client_number,
           c.company_name as converted_client_company,
           (SELECT COUNT(*) FROM follow_ups WHERE lead_id = l.id) AS follow_ups_count,
           (SELECT follow_up_at FROM follow_ups WHERE lead_id = l.id ORDER BY follow_up_at DESC LIMIT 1) AS last_follow_up_at,
           (SELECT outcome FROM follow_ups WHERE lead_id = l.id ORDER BY follow_up_at DESC LIMIT 1) AS last_follow_up_outcome,
           (SELECT next_follow_up_at FROM follow_ups WHERE lead_id = l.id AND next_follow_up_at IS NOT NULL AND completed_at IS NULL ORDER BY next_follow_up_at ASC LIMIT 1) AS next_follow_up_at
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN users creator ON l.created_by = creator.id
    LEFT JOIN clients c ON l.converted_client_id = c.id
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

  // Follow-up due date filter
  if (follow_up_filter === 'overdue') {
    query += ' AND EXISTS (SELECT 1 FROM follow_ups WHERE lead_id = l.id AND next_follow_up_at < NOW() AND completed_at IS NULL)';
  } else if (follow_up_filter === 'today') {
    query += ' AND EXISTS (SELECT 1 FROM follow_ups WHERE lead_id = l.id AND DATE(next_follow_up_at) = CURDATE() AND completed_at IS NULL)';
  } else if (follow_up_filter === 'upcoming') {
    query += ' AND EXISTS (SELECT 1 FROM follow_ups WHERE lead_id = l.id AND DATE(next_follow_up_at) > CURDATE() AND DATE(next_follow_up_at) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND completed_at IS NULL)';
  } else if (follow_up_filter === 'none') {
    query += ' AND NOT EXISTS (SELECT 1 FROM follow_ups WHERE lead_id = l.id AND next_follow_up_at IS NOT NULL AND completed_at IS NULL)';
  }

  // Sorting
  const allowedSortCols = {
    created_at: 'l.created_at',
    name: 'l.name',
    company_name: 'l.company_name',
    estimated_budget: 'l.estimated_budget',
    priority: 'FIELD(l.priority, "Urgent", "High", "Normal", "Low")',
    status: 'l.status',
    next_follow_up_at: 'next_follow_up_at'
  };

  const sortCol = allowedSortCols[sort_by] || 'l.created_at';
  const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortCol} ${order}`;

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get single Lead by ID
export const getLeadById = async (id) => {
  const [rows] = await pool.query(
    `SELECT l.*, 
            u.full_name as assigned_to_name, 
            creator.full_name as created_by_name,
            c.client_number as converted_client_number,
            c.company_name as converted_client_company,
            (SELECT COUNT(*) FROM follow_ups WHERE lead_id = l.id) AS follow_ups_count,
            (SELECT next_follow_up_at FROM follow_ups WHERE lead_id = l.id AND next_follow_up_at IS NOT NULL AND completed_at IS NULL ORDER BY next_follow_up_at ASC LIMIT 1) AS next_follow_up_at
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     LEFT JOIN users creator ON l.created_by = creator.id
     LEFT JOIN clients c ON l.converted_client_id = c.id
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

// ==================== FOLLOW-UP SERVICES ====================

// 9. Create Follow-up for a Lead
export const createFollowUp = async (leadId, followUpData, userId) => {
  const {
    follow_up_at,
    follow_up_type = 'Call',
    outcome = null,
    notes = null,
    owner_id,
    next_follow_up_at = null,
    completed_at = null,
    update_lead_status = null
  } = followUpData;

  // Verify lead exists
  const [leadCheck] = await pool.query('SELECT id, status FROM leads WHERE id = ?', [leadId]);
  if (leadCheck.length === 0) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const assignedOwner = owner_id || userId;
  const followUpTime = follow_up_at ? new Date(follow_up_at) : new Date();

  await pool.query(
    `INSERT INTO follow_ups 
      (lead_id, owner_id, follow_up_at, follow_up_type, outcome, notes, next_follow_up_at, completed_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      leadId,
      assignedOwner,
      followUpTime,
      follow_up_type,
      outcome || null,
      notes || null,
      next_follow_up_at ? new Date(next_follow_up_at) : null,
      completed_at ? new Date(completed_at) : null,
      userId
    ]
  );

  // Optional status update
  if (update_lead_status && update_lead_status !== leadCheck[0].status) {
    await pool.query('UPDATE leads SET status = ? WHERE id = ?', [update_lead_status, leadId]);
  }

  const [createdFollowUp] = await pool.query(
    `SELECT f.*, u.full_name as owner_name, creator.full_name as created_by_name
     FROM follow_ups f
     LEFT JOIN users u ON f.owner_id = u.id
     LEFT JOIN users creator ON f.created_by = creator.id
     WHERE f.lead_id = ?
     ORDER BY f.created_at DESC LIMIT 1`,
    [leadId]
  );

  return createdFollowUp[0];
};

// 10. Get All Follow-ups for a Specific Lead
export const getLeadFollowUps = async (leadId) => {
  const [rows] = await pool.query(
    `SELECT f.*, u.full_name as owner_name, creator.full_name as created_by_name
     FROM follow_ups f
     LEFT JOIN users u ON f.owner_id = u.id
     LEFT JOIN users creator ON f.created_by = creator.id
     WHERE f.lead_id = ?
     ORDER BY f.follow_up_at DESC, f.created_at DESC`,
    [leadId]
  );
  return rows;
};

// 11. Get Due and Overdue Follow-up Reminders
export const getFollowUpReminders = async () => {
  const query = `
    SELECT f.*, 
           l.lead_number, l.name as lead_name, l.phone as lead_phone, 
           l.company_name as lead_company, l.status as lead_status,
           u.full_name as owner_name
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    LEFT JOIN users u ON f.owner_id = u.id
    WHERE f.completed_at IS NULL
      AND (f.next_follow_up_at IS NOT NULL OR f.follow_up_at IS NOT NULL)
    ORDER BY COALESCE(f.next_follow_up_at, f.follow_up_at) ASC
  `;

  const [rows] = await pool.query(query);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const next7DaysEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue = [];
  const today = [];
  const upcoming = [];

  for (const item of rows) {
    const dueTime = new Date(item.next_follow_up_at || item.follow_up_at);
    if (dueTime < todayStart) {
      overdue.push(item);
    } else if (dueTime >= todayStart && dueTime <= todayEnd) {
      today.push(item);
    } else if (dueTime > todayEnd && dueTime <= next7DaysEnd) {
      upcoming.push(item);
    }
  }

  return {
    overdue,
    today,
    upcoming,
    totalCount: rows.length,
    overdueCount: overdue.length,
    todayCount: today.length
  };
};

// 12. Mark Follow-up as Completed
export const completeFollowUp = async (id) => {
  const [res] = await pool.query(
    'UPDATE follow_ups SET completed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
  if (res.affectedRows === 0) {
    const error = new Error('Follow-up record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  const [updated] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [id]);
  return updated[0];
};

// 13. Delete Follow-up
export const deleteFollowUp = async (id) => {
  const [res] = await pool.query('DELETE FROM follow_ups WHERE id = ?', [id]);
  if (res.affectedRows === 0) {
    const error = new Error('Follow-up record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return { message: 'Follow-up deleted successfully' };
};

// ==================== LEAD TO CLIENT CONVERSION ====================

// 14. Convert Won Lead to Client
export const convertLeadToClient = async (leadId, clientOverrides = {}, userId) => {
  // 1. Fetch lead
  const [leadRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);
  if (leadRows.length === 0) {
    const error = new Error('Lead record not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const lead = leadRows[0];

  // 2. Check if already converted
  if (lead.converted_client_id) {
    const error = new Error('This lead has already been converted to a client.');
    error.statusCode = 400;
    error.code = 'ALREADY_CONVERTED';
    throw error;
  }

  // 3. Prepare client details from lead + user overrides
  const clientName = (clientOverrides.name || lead.name).trim();
  const companyName = clientOverrides.company_name !== undefined ? clientOverrides.company_name : lead.company_name;
  const phone = clientOverrides.phone || lead.phone;
  const normalized_phone = normalizePhone(phone);
  const email = clientOverrides.email !== undefined ? clientOverrides.email : lead.email;
  const billingEmail = clientOverrides.billing_email || email;
  const website = clientOverrides.website !== undefined ? clientOverrides.website : lead.website;
  const billingAddress = clientOverrides.billing_address || lead.city || null;
  const onboardingStatus = clientOverrides.onboarding_status || 'Pending';
  
  // Combine internal notes
  const noteParts = [];
  if (lead.requirement) noteParts.push(`Requirement: ${lead.requirement}`);
  if (lead.service_interest) noteParts.push(`Service: ${lead.service_interest}`);
  if (lead.internal_notes) noteParts.push(`Lead Notes: ${lead.internal_notes}`);
  if (clientOverrides.internal_notes) noteParts.push(`Client Notes: ${clientOverrides.internal_notes}`);
  const combinedNotes = noteParts.join('\n');

  // 4. Insert into clients table
  await pool.query(
    `INSERT INTO clients 
      (name, company_name, phone, normalized_phone, email, billing_email, website, billing_address, onboarding_status, internal_notes, converted_from_lead_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientName,
      companyName || null,
      phone || null,
      normalized_phone || null,
      email || null,
      billingEmail || null,
      website || null,
      billingAddress || null,
      onboardingStatus,
      combinedNotes || null,
      lead.id,
      userId
    ]
  );

  // 5. Retrieve created client
  const [newClientRows] = await pool.query(
    'SELECT * FROM clients WHERE converted_from_lead_id = ?',
    [lead.id]
  );
  const newClient = newClientRows[0];

  // 6. Update lead: set status to 'Won', link converted_client_id and converted_at
  await pool.query(
    `UPDATE leads 
     SET status = 'Won',
         converted_client_id = ?,
         converted_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newClient.id, lead.id]
  );

  // 7. Return both updated lead and new client
  const updatedLead = await getLeadById(lead.id);

  return {
    client: newClient,
    lead: updatedLead
  };
};
