import pool from '../config/db.js';
import { generateEstimateNumber, generateInvoiceNumber } from '../utils/financeNumbering.js';
import { logAudit, getAuditLogs } from '../utils/auditLogger.js';
import { numberToIndianWords } from '../utils/numberToWords.js';

export const DEFAULT_TERMS = `Estimate valid for 15 days. Third party fees (hosting, domain, app store accounts, SMS / WhatsApp / email credits, paid APIs and gateway transaction fees) are extra. Client to provide content, branding and access credentials. Additional features / scope changes will be quoted separately. Includes 30 day defect fix warranty after handover; ongoing maintenance is excluded. GST invoicing will follow applicable law. This estimate is not a tax invoice or receipt.`;

export const DEFAULT_SCOPE_MODULES = [
  { module: 'User App', deliverables: 'Login / registration, profile, dashboard, browse services / products, search and basic filters.' },
  { module: 'Payment Gateway', deliverables: 'Booking / order request flow, history, one payment gateway integration, push notifications and contact form' },
  { module: 'Admin Panel', deliverables: 'Admin login, user and listing management, booking / order status, basic reports, database and APIs' },
  { module: 'Testing & Deployment', deliverables: 'Testing, bug fixing, production build and deployment assistance.' }
];

export const DEFAULT_THIRD_PARTY_COSTS = [
  { service: 'Domain Registration', billing_basis: 'Yearly', amount: '2000' },
  { service: 'Shared Hosting', billing_basis: 'Yearly', amount: '1500' },
  { service: 'SMS Gateway', billing_basis: 'Usage based', amount: 'As per Provider' },
  { service: 'Google Map API', billing_basis: 'Usage based', amount: 'As per hit' },
  { service: 'Admin Panel Management', billing_basis: 'Monthly', amount: '5000' }
];

export const DEFAULT_PAYMENT_MILESTONES = [
  { percent: 40, condition: 'on confirmation & kick off' },
  { percent: 40, condition: 'on UAT build / core completion' },
  { percent: 20, condition: 'before final handover' }
];

// Re-export generateEstimateNumber as generateQuotationNumber for backwards compatibility
export const generateQuotationNumber = generateEstimateNumber;

// Helper: Calculate Line Items & Quotation Totals
export const calculateTotals = (items = [], discountRate = 0, taxRate = 0, directDiscountAmount = null) => {
  let subtotal = 0;
  const processedItems = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const discPercent = Number(item.discount_percent) || 0;
    const taxPercent = Number(item.tax_percent) || 0;

    const baseAmount = qty * rate;
    const discountVal = baseAmount * (discPercent / 100);
    const netAmount = baseAmount - discountVal;
    const taxVal = netAmount * (taxPercent / 100);
    const finalAmount = netAmount + taxVal;

    subtotal += netAmount;

    return {
      description: item.description || 'Service/Product Item',
      quantity: qty,
      rate: rate,
      discount_percent: discPercent,
      tax_percent: taxPercent,
      amount: Math.round(finalAmount * 100) / 100,
      sort_order: item.sort_order !== undefined ? item.sort_order : index
    };
  });

  const discRateNum = Number(discountRate) || 0;
  let discountAmount = 0;
  if (directDiscountAmount !== null && directDiscountAmount !== undefined && directDiscountAmount !== '') {
    discountAmount = Math.round(Number(directDiscountAmount) * 100) / 100;
  } else if (discRateNum > 0) {
    discountAmount = Math.round(subtotal * (discRateNum / 100) * 100) / 100;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRateNum = Number(taxRate) || 0;
  const taxAmount = Math.round(taxableAmount * (taxRateNum / 100) * 100) / 100;

  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount_rate: discRateNum,
    discount_amount: discountAmount,
    tax_rate: taxRateNum,
    tax_amount: taxAmount,
    total_amount: totalAmount
  };
};

// 1. Create a New Quotation / Estimate
export const createQuotation = async (data, userId) => {
  const {
    client_id,
    project_id = null,
    title = 'Commercial Proposal & Quotation',
    quotation_date = new Date().toISOString().slice(0, 10),
    valid_until,
    timeline = '45 Days',
    project_type = 'Mobile Application',
    items = [],
    discount_rate = 0,
    discount_amount: directDiscount = null,
    tax_rate = 0,
    terms_and_conditions = DEFAULT_TERMS,
    notes = null,
    scope_modules = DEFAULT_SCOPE_MODULES,
    third_party_costs = DEFAULT_THIRD_PARTY_COSTS,
    payment_milestones = DEFAULT_PAYMENT_MILESTONES
  } = data;

  // Check if client exists
  const [clientRows] = await pool.query('SELECT id, name FROM clients WHERE id = ?', [client_id]);
  if (clientRows.length === 0) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate validity date (default 15 days for estimate)
  let validity = valid_until;
  if (!validity) {
    const d = new Date(quotation_date);
    d.setDate(d.getDate() + 15);
    validity = d.toISOString().slice(0, 10);
  }

  // Generate Estimate Number (HE26001)
  const quotationNumber = await generateEstimateNumber(quotation_date);

  // Compute Totals
  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount: finalDiscountAmount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discount_rate, tax_rate, directDiscount);

  // Insert into quotations table
  await pool.query(
    `INSERT INTO quotations 
      (quotation_number, version, client_id, project_id, title, quotation_date, valid_until, timeline, project_type, status,
       subtotal, discount_rate, discount_amount, tax_rate, tax_amount, total_amount, terms_and_conditions, notes,
       scope_modules, third_party_costs, payment_milestones, created_by)
     VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quotationNumber,
      client_id,
      project_id || null,
      title,
      quotation_date,
      validity,
      timeline,
      project_type,
      subtotal,
      finalDiscountRate,
      finalDiscountAmount,
      finalTaxRate,
      tax_amount,
      total_amount,
      terms_and_conditions,
      notes || null,
      JSON.stringify(scope_modules || []),
      JSON.stringify(third_party_costs || []),
      JSON.stringify(payment_milestones || []),
      userId
    ]
  );

  // Retrieve the generated ID
  const [insertedRows] = await pool.query(
    'SELECT id FROM quotations WHERE quotation_number = ? AND version = 1 ORDER BY created_at DESC LIMIT 1',
    [quotationNumber]
  );
  const quotationId = insertedRows[0].id;

  // Insert Line Items
  if (processedItems.length > 0) {
    const itemValues = processedItems.map((item) => [
      quotationId,
      item.description,
      item.quantity,
      item.rate,
      item.discount_percent,
      item.tax_percent,
      item.amount,
      item.sort_order
    ]);

    await pool.query(
      `INSERT INTO quotation_items 
        (quotation_id, description, quantity, rate, discount_percent, tax_percent, amount, sort_order)
       VALUES ?`,
      [itemValues]
    );
  }

  // Audit Log
  await logAudit({
    actor_user_id: userId,
    action: 'CREATED',
    entity_type: 'quotation',
    entity_id: quotationNumber,
    summary: `Created new Estimate ${quotationNumber} for ${clientRows[0].name} (Total: ₹ ${total_amount.toLocaleString('en-IN')})`,
    metadata: { quotation_number: quotationNumber, total_amount, client_name: clientRows[0].name }
  });

  return getQuotationById(quotationId);
};

// 2. Get All Quotations (with filtering and joins)
export const getQuotations = async ({ client_id, project_id, status, search }) => {
  let query = `
    SELECT 
      q.*,
      c.name AS client_name,
      c.company_name AS client_company,
      c.email AS client_email,
      c.phone AS client_phone,
      p.title AS project_title,
      u.full_name AS created_by_name,
      (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) AS items_count
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN projects p ON q.project_id = p.id
    LEFT JOIN users u ON q.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (client_id) {
    query += ' AND q.client_id = ?';
    params.push(client_id);
  }

  if (project_id) {
    query += ' AND q.project_id = ?';
    params.push(project_id);
  }

  if (status && status !== 'All') {
    query += ' AND q.status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    query += ' AND (q.quotation_number LIKE ? OR q.invoice_number LIKE ? OR q.title LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)';
    params.push(q, q, q, q, q);
  }

  query += ' ORDER BY q.quotation_date DESC, q.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get Single Quotation by ID (including all line items & versions & audit history)
export const getQuotationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
      q.*,
      c.name AS client_name,
      c.company_name AS client_company,
      c.email AS client_email,
      c.phone AS client_phone,
      c.billing_address AS client_billing_address,
      p.title AS project_title,
      u.full_name AS created_by_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN projects p ON q.project_id = p.id
    LEFT JOIN users u ON q.created_by = u.id
    WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  const quotation = rows[0];

  // Parse JSON fields safely
  try {
    quotation.scope_modules = typeof quotation.scope_modules === 'string' ? JSON.parse(quotation.scope_modules) : (quotation.scope_modules || []);
  } catch (e) { quotation.scope_modules = []; }

  try {
    quotation.third_party_costs = typeof quotation.third_party_costs === 'string' ? JSON.parse(quotation.third_party_costs) : (quotation.third_party_costs || []);
  } catch (e) { quotation.third_party_costs = []; }

  try {
    quotation.payment_milestones = typeof quotation.payment_milestones === 'string' ? JSON.parse(quotation.payment_milestones) : (quotation.payment_milestones || []);
  } catch (e) { quotation.payment_milestones = []; }

  // Fetch Line Items
  const [items] = await pool.query(
    'SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC, id ASC',
    [id]
  );
  quotation.items = items;

  // Amount in words
  quotation.amount_in_words = numberToIndianWords(quotation.total_amount);

  // Fetch Other Versions (Audit History)
  const [versionRows] = await pool.query(
    `SELECT id, quotation_number, version, status, total_amount, quotation_date, created_at 
     FROM quotations 
     WHERE quotation_number = ? 
     ORDER BY version ASC`,
    [quotation.quotation_number]
  );
  quotation.versions = versionRows;

  // Fetch Audit Logs
  quotation.audit_logs = await getAuditLogs('quotation', quotation.quotation_number);

  return quotation;
};

// 4. Update Draft Quotation (direct in-place edit during negotiations)
export const updateQuotation = async (id, data, userId) => {
  const [currentRows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id]);
  if (currentRows.length === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  const current = currentRows[0];

  // Allow editing Draft or Sent quotations during negotiations
  if (current.status === 'Superseded') {
    const error = new Error('Cannot edit a superseded quotation. Use the "Revise" feature to create a new version.');
    error.statusCode = 400;
    throw error;
  }

  const {
    title = current.title,
    quotation_date = current.quotation_date,
    valid_until = current.valid_until,
    timeline = current.timeline,
    project_type = current.project_type,
    project_id = current.project_id,
    items = [],
    discount_rate = current.discount_rate,
    discount_amount: directDiscount = data.discount_amount !== undefined ? data.discount_amount : current.discount_amount,
    tax_rate = current.tax_rate,
    terms_and_conditions = current.terms_and_conditions,
    notes = current.notes,
    scope_modules = data.scope_modules !== undefined ? data.scope_modules : current.scope_modules,
    third_party_costs = data.third_party_costs !== undefined ? data.third_party_costs : current.third_party_costs,
    payment_milestones = data.payment_milestones !== undefined ? data.payment_milestones : current.payment_milestones
  } = data;

  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount: finalDiscountAmount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discount_rate, tax_rate, directDiscount);

  // Update Quotation Record
  await pool.query(
    `UPDATE quotations 
     SET title = ?, quotation_date = ?, valid_until = ?, timeline = ?, project_type = ?, project_id = ?,
         subtotal = ?, discount_rate = ?, discount_amount = ?, tax_rate = ?, tax_amount = ?, total_amount = ?,
         terms_and_conditions = ?, notes = ?,
         scope_modules = ?, third_party_costs = ?, payment_milestones = ?
     WHERE id = ?`,
    [
      title,
      quotation_date,
      valid_until,
      timeline,
      project_type,
      project_id || null,
      subtotal,
      finalDiscountRate,
      finalDiscountAmount,
      finalTaxRate,
      tax_amount,
      total_amount,
      terms_and_conditions,
      notes || null,
      JSON.stringify(scope_modules || []),
      JSON.stringify(third_party_costs || []),
      JSON.stringify(payment_milestones || []),
      id
    ]
  );

  // Replace Line Items
  await pool.query('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);

  if (processedItems.length > 0) {
    const itemValues = processedItems.map((item) => [
      id,
      item.description,
      item.quantity,
      item.rate,
      item.discount_percent,
      item.tax_percent,
      item.amount,
      item.sort_order
    ]);

    await pool.query(
      `INSERT INTO quotation_items 
        (quotation_id, description, quantity, rate, discount_percent, tax_percent, amount, sort_order)
       VALUES ?`,
      [itemValues]
    );
  }

  // Audit Log
  await logAudit({
    actor_user_id: userId,
    action: 'UPDATED',
    entity_type: 'quotation',
    entity_id: current.quotation_number,
    summary: `Updated Estimate ${current.quotation_number} (v${current.version}) - New Grand Total: ₹ ${total_amount.toLocaleString('en-IN')}`,
    metadata: { old_total: current.total_amount, new_total: total_amount }
  });

  return getQuotationById(id);
};

// 5. Revise Quotation (Versioning: v1 becomes Superseded, creates v2 Draft for negotiations)
export const reviseQuotation = async (id, revisionData, userId) => {
  const current = await getQuotationById(id);

  if (current.status === 'Superseded') {
    const error = new Error('This quotation version has already been superseded by a newer version.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Mark Current Version as 'Superseded'
  await pool.query(
    "UPDATE quotations SET status = 'Superseded' WHERE id = ?",
    [id]
  );

  const nextVersion = Number(current.version || 1) + 1;
  const items = revisionData.items && revisionData.items.length > 0 ? revisionData.items : current.items;
  const discountRate = revisionData.discount_rate !== undefined ? revisionData.discount_rate : current.discount_rate;
  const directDiscount = revisionData.discount_amount !== undefined ? revisionData.discount_amount : current.discount_amount;
  const taxRate = revisionData.tax_rate !== undefined ? revisionData.tax_rate : current.tax_rate;

  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount: finalDiscountAmount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discountRate, taxRate, directDiscount);

  const quotationDate = revisionData.quotation_date || new Date().toISOString().slice(0, 10);
  let validUntil = revisionData.valid_until;
  if (!validUntil) {
    const d = new Date(quotationDate);
    d.setDate(d.getDate() + 15);
    validUntil = d.toISOString().slice(0, 10);
  }

  const timeline = revisionData.timeline !== undefined ? revisionData.timeline : current.timeline;
  const projectType = revisionData.project_type !== undefined ? revisionData.project_type : current.project_type;
  const scopeModules = revisionData.scope_modules !== undefined ? revisionData.scope_modules : current.scope_modules;
  const thirdPartyCosts = revisionData.third_party_costs !== undefined ? revisionData.third_party_costs : current.third_party_costs;
  const paymentMilestones = revisionData.payment_milestones !== undefined ? revisionData.payment_milestones : current.payment_milestones;

  // 2. Insert New Version
  await pool.query(
    `INSERT INTO quotations 
      (quotation_number, version, parent_quotation_id, client_id, project_id, title, quotation_date, valid_until, timeline, project_type, status,
       subtotal, discount_rate, discount_amount, tax_rate, tax_amount, total_amount, terms_and_conditions, notes,
       scope_modules, third_party_costs, payment_milestones, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      current.quotation_number,
      nextVersion,
      current.id,
      revisionData.client_id || current.client_id,
      revisionData.project_id || current.project_id,
      revisionData.title || current.title,
      quotationDate,
      validUntil,
      timeline,
      projectType,
      subtotal,
      finalDiscountRate,
      finalDiscountAmount,
      finalTaxRate,
      tax_amount,
      total_amount,
      revisionData.terms_and_conditions || current.terms_and_conditions,
      revisionData.notes !== undefined ? revisionData.notes : current.notes,
      JSON.stringify(scopeModules || []),
      JSON.stringify(thirdPartyCosts || []),
      JSON.stringify(paymentMilestones || []),
      userId
    ]
  );

  // Retrieve new quotation ID
  const [newRows] = await pool.query(
    'SELECT id FROM quotations WHERE quotation_number = ? AND version = ? ORDER BY created_at DESC LIMIT 1',
    [current.quotation_number, nextVersion]
  );
  const newQuotationId = newRows[0].id;

  // Insert Line Items for new version
  if (processedItems.length > 0) {
    const itemValues = processedItems.map((item) => [
      newQuotationId,
      item.description,
      item.quantity,
      item.rate,
      item.discount_percent,
      item.tax_percent,
      item.amount,
      item.sort_order
    ]);

    await pool.query(
      `INSERT INTO quotation_items 
        (quotation_id, description, quantity, rate, discount_percent, tax_percent, amount, sort_order)
       VALUES ?`,
      [itemValues]
    );
  }

  // Audit Log
  await logAudit({
    actor_user_id: userId,
    action: 'REVISED',
    entity_type: 'quotation',
    entity_id: current.quotation_number,
    summary: `Negotiation Revision: Estimate ${current.quotation_number} revised to version ${nextVersion} (₹ ${current.total_amount?.toLocaleString('en-IN')} ➔ ₹ ${total_amount.toLocaleString('en-IN')})`,
    metadata: { version: nextVersion, old_total: current.total_amount, new_total: total_amount }
  });

  return getQuotationById(newQuotationId);
};

// 6. Convert Estimate to Official Tax Invoice (Generates HIN26001 and sets status to Accepted)
export const convertToInvoice = async (id, userId) => {
  const quotation = await getQuotationById(id);

  if (quotation.invoice_number) {
    return quotation;
  }

  const invoiceNumber = await generateInvoiceNumber(quotation.quotation_date);

  await pool.query(
    `UPDATE quotations 
     SET invoice_number = ?, status = CASE WHEN status IN ('Draft', 'Sent') THEN 'Accepted' ELSE status END
     WHERE id = ?`,
    [invoiceNumber, id]
  );

  await logAudit({
    actor_user_id: userId,
    action: 'CONVERTED_TO_INVOICE',
    entity_type: 'quotation',
    entity_id: quotation.quotation_number,
    summary: `Estimate ${quotation.quotation_number} converted to official Invoice ${invoiceNumber}`,
    metadata: { invoice_number: invoiceNumber, amount: quotation.total_amount }
  });

  return getQuotationById(id);
};

// 7. Update Quotation Status
export const updateQuotationStatus = async (id, status, userId) => {
  const validStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Superseded'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const current = await getQuotationById(id);

  const [res] = await pool.query(
    'UPDATE quotations SET status = ? WHERE id = ?',
    [status, id]
  );

  if (res.affectedRows === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  await logAudit({
    actor_user_id: userId,
    action: 'STATUS_CHANGED',
    entity_type: 'quotation',
    entity_id: current.quotation_number,
    summary: `Estimate ${current.quotation_number} status changed to ${status}`,
    metadata: { old_status: current.status, new_status: status }
  });

  return getQuotationById(id);
};

// 8. Delete Quotation
export const deleteQuotation = async (id, userId) => {
  const [rows] = await pool.query('SELECT status, quotation_number FROM quotations WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  const quoteNum = rows[0].quotation_number;

  await pool.query('DELETE FROM quotations WHERE id = ?', [id]);

  await logAudit({
    actor_user_id: userId,
    action: 'DELETED',
    entity_type: 'quotation',
    entity_id: quoteNum,
    summary: `Deleted quotation record ${quoteNum}`,
    metadata: { quotation_number: quoteNum }
  });

  return { message: 'Quotation deleted successfully' };
};

// 9. Financial & Quotations Metrics Summary
export const getQuotationMetrics = async () => {
  const [totalRows] = await pool.query('SELECT COUNT(*) AS total_count, COALESCE(SUM(total_amount), 0) AS total_val FROM quotations');
  const [acceptedRows] = await pool.query("SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS val FROM quotations WHERE status = 'Accepted'");
  const [pendingRows] = await pool.query("SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS val FROM quotations WHERE status IN ('Draft', 'Sent')");
  const [expiredRows] = await pool.query("SELECT COUNT(*) AS count FROM quotations WHERE status = 'Expired'");

  const totalCount = Number(totalRows[0].total_count) || 0;
  const acceptedCount = Number(acceptedRows[0].count) || 0;
  const conversionRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  return {
    total_count: totalCount,
    total_value: Number(totalRows[0].total_val) || 0,
    accepted_count: acceptedCount,
    accepted_value: Number(acceptedRows[0].val) || 0,
    pending_count: Number(pendingRows[0].count) || 0,
    pending_value: Number(pendingRows[0].val) || 0,
    expired_count: Number(expiredRows[0].count) || 0,
    conversion_rate: conversionRate
  };
};
