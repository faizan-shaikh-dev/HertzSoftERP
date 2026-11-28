import pool from './db.js';

export async function migrateHrSchema() {
  const sql = `
CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('Full-time', 'Intern') NOT NULL DEFAULT 'Full-time',
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  personal_email VARCHAR(255) NULL,
  phone VARCHAR(30) NOT NULL,
  alternate_phone VARCHAR(30) NULL,
  gender ENUM('Male', 'Female', 'Other') NULL,
  date_of_birth DATE NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(120) NOT NULL,
  joining_date DATE NOT NULL,
  status ENUM('Active', 'Probation', 'Completed', 'Exited', 'On Leave') NOT NULL DEFAULT 'Active',
  work_mode ENUM('On-site', 'Hybrid', 'Remote') NOT NULL DEFAULT 'On-site',
  
  -- Full-time specific fields
  salary_monthly DECIMAL(12, 2) NULL DEFAULT 0.00,
  probation_period_months INT DEFAULT 3,
  emergency_contact_name VARCHAR(120) NULL,
  emergency_contact_phone VARCHAR(30) NULL,
  pan_number VARCHAR(30) NULL,
  aadhaar_number VARCHAR(30) NULL,
  bank_name VARCHAR(100) NULL,
  account_number VARCHAR(50) NULL,
  ifsc_code VARCHAR(30) NULL,
  upi_id VARCHAR(100) NULL,
  resignation_date DATE NULL,
  exit_date DATE NULL,
  
  -- Education & College Background (Both Full-time and Interns)
  college_name VARCHAR(200) NULL,
  degree VARCHAR(120) NULL,
  university_name VARCHAR(200) NULL,
  passing_year VARCHAR(20) NULL,

  -- Intern specific fields
  internship_duration VARCHAR(50) NULL,
  internship_end_date DATE NULL,
  mentor_id CHAR(36) NULL,
  mentor_name VARCHAR(150) NULL,
  stipend_monthly DECIMAL(10, 2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  certificate_id CHAR(36) NULL,
  
  -- General Address & Notes
  address TEXT NULL,
  city VARCHAR(100) NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_emp_type (type),
  INDEX idx_emp_status (status),
  INDEX idx_emp_code (employee_code),
  INDEX idx_emp_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  try {
    await pool.query(sql);
    console.log('✅ employees table created/verified successfully in MySQL!');
  } catch (err) {
    console.error('❌ Error creating employees table:', err.message);
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1]?.includes('migrate_hr_schema')) {
  migrateHrSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
