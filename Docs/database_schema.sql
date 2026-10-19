-- Hertzsoft CRM Phase 1 starter schema (MySQL / phpMyAdmin)
-- Engine: InnoDB, Charset: utf8mb4

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lead_type ENUM('Student','Client') NOT NULL DEFAULT 'Client',
  lead_number BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  normalized_phone VARCHAR(30) NOT NULL,
  email VARCHAR(255) NULL,
  company_name VARCHAR(180) NULL,
  alternate_phone VARCHAR(30) NULL,
  website TEXT NULL,
  designation VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  requirement TEXT NOT NULL,
  service_interest VARCHAR(150) NULL,
  source VARCHAR(100) NULL,
  source_details TEXT NULL,
  estimated_budget DECIMAL(12,2) NULL,
  expected_decision_date DATE NULL,
  domain_available ENUM('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
  hosting_available ENUM('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
  status ENUM('New','Contacted','Qualified','Quotation Sent','Negotiation','Won','Lost','On Hold') NOT NULL DEFAULT 'New',
  priority ENUM('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal',
  assigned_to CHAR(36) NOT NULL,
  created_by CHAR(36) NOT NULL,
  lost_reason TEXT NULL,
  on_hold_reason TEXT NULL,
  revisit_date DATE NULL,
  internal_notes TEXT NULL,
  duplicate_override BOOLEAN NOT NULL DEFAULT FALSE,
  converted_client_id CHAR(36) NULL,
  converted_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_normalized_phone ON leads(normalized_phone);

-- 5. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_number BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
  name VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NULL,
  phone VARCHAR(30) NULL,
  normalized_phone VARCHAR(30) NULL,
  email VARCHAR(255) NULL,
  website TEXT NULL,
  billing_address TEXT NULL,
  contact_address TEXT NULL,
  billing_email VARCHAR(255) NULL,
  tax_details JSON NULL,
  onboarding_status ENUM('Pending','In Progress','Completed','On Hold') NOT NULL DEFAULT 'Pending',
  internal_notes TEXT NULL,
  converted_from_lead_id CHAR(36) UNIQUE NULL,
  created_by CHAR(36) NOT NULL,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (converted_from_lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Foreign key link for converted lead
ALTER TABLE leads
  ADD CONSTRAINT fk_leads_converted_client
  FOREIGN KEY (converted_client_id) REFERENCES clients(id) ON DELETE RESTRICT;

CREATE INDEX idx_clients_normalized_phone ON clients(normalized_phone);
CREATE INDEX idx_clients_name ON clients(name);

-- 6. Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lead_id CHAR(36) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  follow_up_at TIMESTAMP NOT NULL,
  follow_up_type ENUM('Call','Email','Meeting','Message','Other') NOT NULL,
  outcome VARCHAR(100) NULL,
  notes TEXT NULL,
  next_follow_up_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_followups_due ON follow_ups(follow_up_at);
CREATE INDEX idx_followups_lead ON follow_ups(lead_id);

-- 7. Onboarding Items Table
CREATE TABLE IF NOT EXISTS onboarding_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  status ENUM('Pending','In Progress','Completed','Skipped') NOT NULL DEFAULT 'Pending',
  assigned_to CHAR(36) NULL,
  due_date DATE NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  owner_id CHAR(36) NOT NULL,
  due_at TIMESTAMP NULL,
  status ENUM('Pending','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  priority ENUM('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal',
  completed_at TIMESTAMP NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  actor_user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NULL,
  summary TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Seed Initial System Roles
INSERT IGNORE INTO roles (id, name) VALUES
  (UUID(), 'Administrator'),
  (UUID(), 'Sales'),
  (UUID(), 'Project Manager'),
  (UUID(), 'Team Member'),
  (UUID(), 'Finance'),
  (UUID(), 'HR');
