import pool from '../config/db.js';

// ==================== CLIENT SERVICES ====================

// 1. Create a new Client
export const createClient = async (clientData, userId) => {
  const {
    name,
    company_name = null,
    phone = null,
    email = null,
    website = null,
    billing_address = null,
    internal_notes = null
  } = clientData;

  const normalized_phone = phone ? phone.replace(/\D/g, '') : null;

  await pool.query(
    `INSERT INTO clients 
      (name, company_name, phone, normalized_phone, email, website, billing_address, internal_notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, company_name, phone, normalized_phone, email, website, billing_address, internal_notes, userId]
  );

  const [row] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC LIMIT 1');
  return row[0];
};

// 2. Get All Clients
export const getClients = async ({ search }) => {
  let query = 'SELECT * FROM clients WHERE archived_at IS NULL';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR company_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get Single Client with their Projects, Payments & Full Analytics
export const getClientById = async (id) => {
  // Try finding by Client ID first; fallback to converted_from_lead_id
  let [clientRows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
  if (clientRows.length === 0) {
    [clientRows] = await pool.query('SELECT * FROM clients WHERE converted_from_lead_id = ?', [id]);
  }
  if (clientRows.length === 0) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const client = clientRows[0];
  const clientId = client.id;

  // 1. Fetch client's projects
  const [projects] = await pool.query(
    `SELECT p.*, 
            COALESCE(SUM(pm.amount_paid), 0) AS total_paid,
            (p.total_cost - COALESCE(SUM(pm.amount_paid), 0)) AS due_balance
     FROM projects p
     LEFT JOIN payments pm ON p.id = pm.project_id
     WHERE p.client_id = ?
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [clientId]
  );
  client.projects = projects;

  // 2. Fetch client's recorded payments
  const [payments] = await pool.query(
    `SELECT pm.*, 
            p.title AS project_title,
            u.full_name AS recorded_by_name
     FROM payments pm
     LEFT JOIN projects p ON pm.project_id = p.id
     LEFT JOIN users u ON pm.recorded_by = u.id
     WHERE pm.client_id = ?
     ORDER BY pm.payment_date DESC, pm.created_at DESC`,
    [clientId]
  );
  client.payments = payments;

  // 3. Fetch converted Lead info & Follow-ups if available
  if (client.converted_from_lead_id) {
    const [leadRows] = await pool.query(
      `SELECT l.*, u.full_name AS assigned_to_name
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = ?`,
      [client.converted_from_lead_id]
    );
    if (leadRows.length > 0) {
      client.lead = leadRows[0];
      const [followUps] = await pool.query(
        `SELECT fu.*, u.full_name AS created_by_name
         FROM follow_ups fu
         LEFT JOIN users u ON fu.created_by = u.id
         WHERE fu.lead_id = ?
         ORDER BY fu.scheduled_at DESC, fu.created_at DESC`,
        [client.converted_from_lead_id]
      );
      client.lead.follow_ups = followUps;
    }
  }

  // 4. Compute comprehensive analytics
  const totalContractValue = projects.reduce((sum, p) => sum + Number(p.total_cost || 0), 0);
  const totalPaid = payments.reduce((sum, pm) => sum + Number(pm.amount_paid || 0), 0);
  const totalDue = Math.max(0, totalContractValue - totalPaid);
  const collectionPercentage = totalContractValue > 0 ? Math.min(100, Math.round((totalPaid / totalContractValue) * 100)) : 0;
  
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
  const completionPercentage = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  client.analytics = {
    total_contract_value: totalContractValue,
    total_paid: totalPaid,
    total_due: totalDue,
    collection_percentage: collectionPercentage,
    total_projects: totalProjects,
    completed_projects: completedProjects,
    in_progress_projects: inProgressProjects,
    completion_percentage: completionPercentage
  };

  return client;
};


// ==================== PROJECT SERVICES ====================

// 4. Create a Project
export const createProject = async (projectData, userId) => {
  const {
    client_id,
    title,
    description = null,
    total_cost = 0.00,
    status = 'Not Started',
    start_date = null,
    deadline = null
  } = projectData;

  await pool.query(
    `INSERT INTO projects 
      (client_id, title, description, total_cost, status, start_date, deadline, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [client_id, title, description, total_cost, status, start_date, deadline, userId]
  );

  const [row] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 1');
  return row[0];
};

// 5. Get All Projects (with Auto-Calculated Payments & Balance)
export const getProjects = async ({ status, client_id, search }) => {
  let query = `
    SELECT 
      p.*,
      c.name AS client_name,
      c.company_name AS client_company,
      COALESCE(SUM(pm.amount_paid), 0) AS total_paid,
      (p.total_cost - COALESCE(SUM(pm.amount_paid), 0)) AS due_balance
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN payments pm ON p.id = pm.project_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (client_id) {
    query += ' AND p.client_id = ?';
    params.push(client_id);
  }

  if (search) {
    query += ' AND (p.title LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  query += ' GROUP BY p.id, c.name, c.company_name ORDER BY p.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 6. Get Single Project with Payment History
export const getProjectById = async (id) => {
  const [projectRows] = await pool.query(
    `SELECT 
      p.*,
      c.name AS client_name,
      c.company_name AS client_company,
      c.phone AS client_phone,
      c.email AS client_email,
      c.billing_address AS client_address,
      COALESCE(SUM(pm.amount_paid), 0) AS total_paid,
      (p.total_cost - COALESCE(SUM(pm.amount_paid), 0)) AS due_balance
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN payments pm ON p.id = pm.project_id
    WHERE p.id = ?
    GROUP BY p.id, c.name, c.company_name, c.phone, c.email, c.billing_address`,
    [id]
  );

  if (projectRows.length === 0) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const project = projectRows[0];

  // Fetch all payment installments for this project with user info
  const [payments] = await pool.query(
    `SELECT pm.*, u.full_name AS recorded_by_name 
     FROM payments pm 
     LEFT JOIN users u ON pm.recorded_by = u.id 
     WHERE pm.project_id = ? 
     ORDER BY pm.payment_date DESC, pm.created_at DESC`,
    [id]
  );

  project.payment_history = payments;
  return project;
};

// 7. Update Project
export const updateProject = async (id, updateData) => {
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updateData)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'client_id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  return await getProjectById(id);
};

// 8. Delete Project
export const deleteProject = async (id) => {
  const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return { message: 'Project deleted successfully' };
};
