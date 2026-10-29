import pool from '../config/db.js';

// Helper to generate sequential quotation number (e.g. QT-2026-0001)
export const generateQuotationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `QT-${currentYear}-`;

  const [rows] = await pool.query(
    'SELECT quotation_number FROM quotations WHERE quotation_number LIKE ? ORDER BY quotation_number DESC LIMIT 1',
    [`${prefix}%`]
  );

  if (rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumStr = rows[0].quotation_number.replace(prefix, '');
  const lastNum = parseInt(lastNumStr, 10);
  const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

// Helper: Calculate Line Items & Quotation Totals
const calculateTotals = (items = [], discountRate = 0, taxRate = 0) => {
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
  const discountAmount = Math.round(subtotal * (discRateNum / 100) * 100) / 100;

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

// 1. Create a New Quotation
export const createQuotation = async (data, userId) => {
  const {
    client_id,
    project_id = null,
    title = 'Commercial Proposal & Quotation',
    quotation_date = new Date().toISOString().slice(0, 10),
    valid_until,
    items = [],
    discount_rate = 0,
    tax_rate = 18.00,
    terms_and_conditions = '1. 50% Advance on project initiation.\n2. 50% Upon milestone completion.\n3. Quotation is valid for 30 days from date of issue.',
    notes = null
  } = data;

  // Check if client exists
  const [clientRows] = await pool.query('SELECT id, name FROM clients WHERE id = ?', [client_id]);
  if (clientRows.length === 0) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate validity date (default 30 days from quotation_date if not specified)
  let validity = valid_until;
  if (!validity) {
    const d = new Date(quotation_date);
    d.setDate(d.getDate() + 30);
    validity = d.toISOString().slice(0, 10);
  }

  // Generate Quotation Number
  const quotationNumber = await generateQuotationNumber();

  // Compute Totals
  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discount_rate, tax_rate);

  // Insert into quotations table
  const [quotationResult] = await pool.query(
    `INSERT INTO quotations 
      (quotation_number, version, client_id, project_id, title, quotation_date, valid_until, status,
       subtotal, discount_rate, discount_amount, tax_rate, tax_amount, total_amount, terms_and_conditions, notes, created_by)
     VALUES (?, 1, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quotationNumber,
      client_id,
      project_id || null,
      title,
      quotation_date,
      validity,
      subtotal,
      finalDiscountRate,
      discount_amount,
      finalTaxRate,
      tax_amount,
      total_amount,
      terms_and_conditions,
      notes || null,
      userId
    ]
  );

  // Retrieve the generated ID (since DEFAULT (uuid()) generates it in MySQL)
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
    query += ' AND (q.quotation_number LIKE ? OR q.title LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)';
    params.push(q, q, q, q);
  }

  query += ' ORDER BY q.quotation_date DESC, q.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get Single Quotation by ID (including all line items & versions)
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

  // Fetch Line Items
  const [items] = await pool.query(
    'SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC, id ASC',
    [id]
  );
  quotation.items = items;

  // Fetch Other Versions (Audit History)
  const [versionRows] = await pool.query(
    `SELECT id, quotation_number, version, status, total_amount, quotation_date, created_at 
     FROM quotations 
     WHERE quotation_number = ? 
     ORDER BY version ASC`,
    [quotation.quotation_number]
  );
  quotation.versions = versionRows;

  return quotation;
};

// 4. Update Draft Quotation
export const updateQuotation = async (id, data) => {
  const [currentRows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id]);
  if (currentRows.length === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  const current = currentRows[0];

  // Only allow updating Draft quotations to prevent tampering with historical quotes
  if (current.status !== 'Draft') {
    const error = new Error(`Cannot edit quotation with status "${current.status}". Use the "Revise" feature to create a new version.`);
    error.statusCode = 400;
    throw error;
  }

  const {
    title = current.title,
    quotation_date = current.quotation_date,
    valid_until = current.valid_until,
    project_id = current.project_id,
    items = [],
    discount_rate = current.discount_rate,
    tax_rate = current.tax_rate,
    terms_and_conditions = current.terms_and_conditions,
    notes = current.notes
  } = data;

  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discount_rate, tax_rate);

  // Update Quotation Record
  await pool.query(
    `UPDATE quotations 
     SET title = ?, quotation_date = ?, valid_until = ?, project_id = ?,
         subtotal = ?, discount_rate = ?, discount_amount = ?, tax_rate = ?, tax_amount = ?, total_amount = ?,
         terms_and_conditions = ?, notes = ?
     WHERE id = ?`,
    [
      title,
      quotation_date,
      valid_until,
      project_id || null,
      subtotal,
      finalDiscountRate,
      discount_amount,
      finalTaxRate,
      tax_amount,
      total_amount,
      terms_and_conditions,
      notes || null,
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

  return getQuotationById(id);
};

// 5. Revise Quotation (Versioning: v1 becomes Superseded, creates v2 Draft)
export const reviseQuotation = async (id, revisionData, userId) => {
  const current = await getQuotationById(id);

  // If already superseded, disallow
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
  const taxRate = revisionData.tax_rate !== undefined ? revisionData.tax_rate : current.tax_rate;

  const {
    processedItems,
    subtotal,
    discount_rate: finalDiscountRate,
    discount_amount,
    tax_rate: finalTaxRate,
    tax_amount,
    total_amount
  } = calculateTotals(items, discountRate, taxRate);

  const quotationDate = revisionData.quotation_date || new Date().toISOString().slice(0, 10);
  let validUntil = revisionData.valid_until;
  if (!validUntil) {
    const d = new Date(quotationDate);
    d.setDate(d.getDate() + 30);
    validUntil = d.toISOString().slice(0, 10);
  }

  // 2. Insert New Version
  await pool.query(
    `INSERT INTO quotations 
      (quotation_number, version, parent_quotation_id, client_id, project_id, title, quotation_date, valid_until, status,
       subtotal, discount_rate, discount_amount, tax_rate, tax_amount, total_amount, terms_and_conditions, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      current.quotation_number,
      nextVersion,
      current.id,
      revisionData.client_id || current.client_id,
      revisionData.project_id || current.project_id,
      revisionData.title || current.title,
      quotationDate,
      validUntil,
      subtotal,
      finalDiscountRate,
      discount_amount,
      finalTaxRate,
      tax_amount,
      total_amount,
      revisionData.terms_and_conditions || current.terms_and_conditions,
      revisionData.notes !== undefined ? revisionData.notes : current.notes,
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

  return getQuotationById(newQuotationId);
};

// 6. Update Quotation Status
export const updateQuotationStatus = async (id, status) => {
  const validStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Superseded'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const [res] = await pool.query(
    'UPDATE quotations SET status = ? WHERE id = ?',
    [status, id]
  );

  if (res.affectedRows === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  return getQuotationById(id);
};

// 7. Delete Quotation
export const deleteQuotation = async (id) => {
  const [rows] = await pool.query('SELECT status, quotation_number FROM quotations WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Quotation not found');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM quotations WHERE id = ?', [id]);
  return { message: 'Quotation deleted successfully' };
};

// 8. Financial & Quotations Metrics Summary
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

// 9. Generate Official Printable HTML Template for Quotation
export const generatePrintableHtml = async (id) => {
  const q = await getQuotationById(id);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const lineItemsHtml = (q.items || []).map((item, index) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">${index + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 500;">
        ${item.description}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #334155;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${formatCurrency(item.rate)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${item.tax_percent > 0 ? `${item.tax_percent}%` : '—'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quotation ${q.quotation_number} (v${q.version}) - Hertzsoft</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 30px; color: #1e293b; }
        .page { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0f172a; margin-bottom: 28px; }
        .brand-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4; }
        .quote-badge { text-align: right; }
        .quote-title { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
        .quote-num { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px; font-family: monospace; }
        .version-pill { display: inline-block; padding: 2px 8px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 11px; font-weight: 700; margin-top: 4px; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .card-box { background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12.5px; line-height: 1.5; }
        .card-label { font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .client-name { font-size: 14px; font-weight: 700; color: #0f172a; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f1f5f9; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
        
        .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-table { width: 320px; font-size: 13px; }
        .totals-table tr td { padding: 6px 0; }
        .totals-table tr.total-row td { padding-top: 10px; border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; color: #0f172a; }

        .terms-box { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; font-size: 12px; line-height: 1.6; margin-bottom: 36px; }
        .terms-title { font-weight: 700; color: #374151; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; }

        .signature-area { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        .sign-box { text-align: center; width: 200px; }
        .sign-line { border-bottom: 1px solid #94a3b8; height: 40px; margin-bottom: 8px; }

        @media print {
          body { padding: 0; background: none; }
          .page { border: none; box-shadow: none; padding: 20px; max-width: 100%; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="max-width: 820px; margin: 0 auto 16px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="page">
        <!-- Header -->
        <div class="header">
          <div>
            <div class="brand-title">HERTZSOFT TECHNOLOGIES</div>
            <div class="brand-sub">
              Enterprise Software Solutions & IT Consultancy<br>
              Email: info@hertzsoft.com | Web: https://hertzsoft.com
            </div>
          </div>
          <div class="quote-badge">
            <div class="quote-title">QUOTATION</div>
            <div class="quote-num">${q.quotation_number}</div>
            <div class="version-pill">Version ${q.version} ${q.status === 'Superseded' ? '(Superseded)' : ''}</div>
          </div>
        </div>

        <!-- Meta Info Grid -->
        <div class="grid-2">
          <div class="card-box">
            <div class="card-label">Quotation Prepared For:</div>
            <div class="client-name">${q.client_name}</div>
            ${q.client_company ? `<div><strong>Company:</strong> ${q.client_company}</div>` : ''}
            ${q.client_email ? `<div><strong>Email:</strong> ${q.client_email}</div>` : ''}
            ${q.client_phone ? `<div><strong>Phone:</strong> ${q.client_phone}</div>` : ''}
            ${q.client_billing_address ? `<div><strong>Address:</strong> ${q.client_billing_address}</div>` : ''}
          </div>

          <div class="card-box">
            <div class="card-label">Proposal Details:</div>
            <div><strong>Subject:</strong> ${q.title}</div>
            ${q.project_title ? `<div><strong>Project:</strong> ${q.project_title}</div>` : ''}
            <div><strong>Issue Date:</strong> ${formatDate(q.quotation_date)}</div>
            <div><strong>Valid Until:</strong> ${formatDate(q.valid_until)}</div>
            <div><strong>Status:</strong> <span style="font-weight: 700;">${q.status}</span></div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Description / Scope Deliverables</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Rate</th>
              <th style="width: 70px; text-align: right;">Disc</th>
              <th style="width: 70px; text-align: right;">Tax</th>
              <th style="width: 120px; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <!-- Totals Calculation -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">${formatCurrency(q.subtotal)}</td>
            </tr>
            ${q.discount_amount > 0 ? `
            <tr>
              <td style="color: #64748b;">Discount (${q.discount_rate}%):</td>
              <td style="text-align: right; color: #dc2626; font-weight: 600;">- ${formatCurrency(q.discount_amount)}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #64748b;">Tax / GST (${q.tax_rate}%):</td>
              <td style="text-align: right; font-weight: 600;">+ ${formatCurrency(q.tax_amount)}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total:</td>
              <td style="text-align: right;">${formatCurrency(q.total_amount)}</td>
            </tr>
          </table>
        </div>

        <!-- Terms and Notes -->
        ${q.terms_and_conditions ? `
        <div class="terms-box">
          <div class="terms-title">Terms & Conditions:</div>
          <div style="white-space: pre-line; color: #4b5563;">${q.terms_and_conditions}</div>
        </div>` : ''}

        ${q.notes ? `
        <div style="font-size: 12px; color: #64748b; margin-bottom: 24px;">
          <strong>Additional Notes:</strong> ${q.notes}
        </div>` : ''}

        <!-- Signatures Area -->
        <div class="signature-area">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Client Acceptance Signature</div>
            <div style="font-size: 10px; color: #64748b;">Date & Stamp</div>
          </div>

          <div class="sign-box">
            <div class="sign-line"></div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Authorized Signatory</div>
            <div style="font-size: 10px; color: #64748b;">Hertzsoft Technologies</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

