import pool from '../config/db.js';

// Auto-generate employee code: HE-EMP-101, HE-INT-101
export const generateEmployeeCode = async (type) => {
  const prefix = type === 'Intern' ? 'HE-INT' : 'HE-EMP';
  const [rows] = await pool.query(
    'SELECT employee_code FROM employees WHERE type = ? ORDER BY created_at DESC LIMIT 1',
    [type]
  );

  if (rows.length > 0 && rows[0].employee_code) {
    const match = rows[0].employee_code.match(/(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
  }

  // Default starting sequence
  return `${prefix}-101`;
};

// 1. Get All Employees / Interns with filters & search
export const getEmployees = async ({ type, department, status, work_mode, search }) => {
  let query = `
    SELECT e.*, u.full_name AS created_by_name
    FROM employees e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type && type !== 'All') {
    query += ' AND e.type = ?';
    params.push(type);
  }

  if (department && department !== 'All') {
    query += ' AND e.department = ?';
    params.push(department);
  }

  if (status && status !== 'All') {
    query += ' AND e.status = ?';
    params.push(status);
  }

  if (work_mode && work_mode !== 'All') {
    query += ' AND e.work_mode = ?';
    params.push(work_mode);
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    query += ` AND (
      e.name LIKE ? OR 
      e.employee_code LIKE ? OR 
      e.email LIKE ? OR 
      e.phone LIKE ? OR 
      e.designation LIKE ? OR 
      e.college_name LIKE ?
    )`;
    params.push(q, q, q, q, q, q);
  }

  query += ' ORDER BY e.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 2. Get Employee by ID
export const getEmployeeById = async (id) => {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name AS created_by_name
     FROM employees e
     LEFT JOIN users u ON e.created_by = u.id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// 3. Create Employee or Intern
export const createEmployee = async (data, userId) => {
  const type = data.type === 'Intern' ? 'Intern' : 'Full-time';
  const employee_code = data.employee_code?.trim() || await generateEmployeeCode(type);

  const [res] = await pool.query(
    `INSERT INTO employees (
      employee_code, type, name, email, personal_email, phone, alternate_phone,
      gender, date_of_birth, department, designation, joining_date, status, work_mode,
      salary_monthly, probation_period_months, emergency_contact_name, emergency_contact_phone,
      pan_number, aadhaar_number, bank_name, account_number, ifsc_code, upi_id,
      college_name, degree, internship_duration, internship_end_date, mentor_id, mentor_name,
      stipend_monthly, is_paid, certificate_id, address, city, notes, created_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )`,
    [
      employee_code,
      type,
      data.name,
      data.email,
      data.personal_email || null,
      data.phone,
      data.alternate_phone || null,
      data.gender || null,
      data.date_of_birth || null,
      data.department,
      data.designation,
      data.joining_date || new Date().toISOString().slice(0, 10),
      data.status || 'Active',
      data.work_mode || 'On-site',
      Number(data.salary_monthly) || 0.00,
      Number(data.probation_period_months) || 3,
      data.emergency_contact_name || null,
      data.emergency_contact_phone || null,
      data.pan_number || null,
      data.aadhaar_number || null,
      data.bank_name || null,
      data.account_number || null,
      data.ifsc_code || null,
      data.upi_id || null,
      data.college_name || null,
      data.degree || null,
      data.internship_duration || null,
      data.internship_end_date || null,
      data.mentor_id || null,
      data.mentor_name || null,
      Number(data.stipend_monthly) || 0.00,
      data.is_paid ? 1 : 0,
      data.certificate_id || null,
      data.address || null,
      data.city || null,
      data.notes || null,
      userId || null
    ]
  );

  const [row] = await pool.query('SELECT * FROM employees WHERE employee_code = ?', [employee_code]);
  return row[0];
};

// 4. Update Employee
export const updateEmployee = async (id, data) => {
  const fields = [
    'name', 'email', 'personal_email', 'phone', 'alternate_phone',
    'gender', 'date_of_birth', 'department', 'designation', 'joining_date', 'status', 'work_mode',
    'salary_monthly', 'probation_period_months', 'emergency_contact_name', 'emergency_contact_phone',
    'pan_number', 'aadhaar_number', 'bank_name', 'account_number', 'ifsc_code', 'upi_id',
    'college_name', 'degree', 'internship_duration', 'internship_end_date', 'mentor_id', 'mentor_name',
    'stipend_monthly', 'is_paid', 'certificate_id', 'address', 'city', 'notes', 'resignation_date', 'exit_date'
  ];

  const updates = [];
  const params = [];

  for (const f of fields) {
    if (data[f] !== undefined) {
      updates.push(`${f} = ?`);
      if (f === 'is_paid') {
        params.push(data[f] ? 1 : 0);
      } else {
        params.push(data[f] === '' ? null : data[f]);
      }
    }
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const [row] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
  return row[0];
};

// 5. Delete Employee
export const deleteEmployee = async (id) => {
  const [res] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
  return res.affectedRows > 0;
};

// 6. Summary Stats
export const getEmployeeStats = async () => {
  const [totalFullTime] = await pool.query("SELECT COUNT(*) AS count FROM employees WHERE type = 'Full-time'");
  const [totalInterns] = await pool.query("SELECT COUNT(*) AS count FROM employees WHERE type = 'Intern'");
  const [activeCount] = await pool.query("SELECT COUNT(*) AS count FROM employees WHERE status = 'Active'");
  const [probationCount] = await pool.query("SELECT COUNT(*) AS count FROM employees WHERE status = 'Probation'");

  return {
    total_full_time: totalFullTime[0].count,
    total_interns: totalInterns[0].count,
    active_count: activeCount[0].count,
    probation_count: probationCount[0].count
  };
};
