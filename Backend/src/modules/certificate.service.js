import pool from '../config/db.js';

// Helper to generate unique serial code (e.g., HZ-2026-FS-8492)
const generateCertNumber = (docType, domain) => {
  const prefix = docType === 'Offer Letter' ? 'HZ-OFFER' : (docType === 'Appointment Letter' ? 'HZ-APPT' : (docType === 'Internship Certificate' ? 'HZ-INT' : (docType === 'Experience Letter' ? 'HZ-EXP' : 'HZ-DOC')));
  const domainCode = (domain && typeof domain === 'string' && domain.length >= 2) ? domain.substring(0, 2).toUpperCase() : 'HS';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${domainCode}-${randomNum}`;
};

// 1. Create / Issue a Certificate or Offer Letter
export const createCertificate = async (data, userId) => {
  const {
    candidate_name,
    candidate_email = null,
    candidate_phone = null,
    document_type,
    course_or_domain,
    start_date = null,
    end_date = null,
    issue_date = new Date().toISOString().slice(0, 10),
    stipend = null,
    performance_rating = 'Excellent'
  } = data;

  const certificate_number = generateCertNumber(document_type, course_or_domain);

  await pool.query(
    `INSERT INTO certificates 
      (certificate_number, candidate_name, candidate_email, candidate_phone, document_type, course_or_domain, start_date, end_date, issue_date, stipend, performance_rating, issued_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      certificate_number,
      candidate_name,
      candidate_email || null,
      candidate_phone || null,
      document_type,
      course_or_domain,
      start_date || null,
      end_date || null,
      issue_date,
      stipend || null,
      performance_rating || 'Excellent',
      userId
    ]
  );

  const [row] = await pool.query('SELECT * FROM certificates WHERE certificate_number = ?', [certificate_number]);
  return row[0];
};

// 2. Get All Issued Certificates
export const getCertificates = async ({ document_type, search }) => {
  let query = `
    SELECT c.*, u.full_name as issued_by_name 
    FROM certificates c
    LEFT JOIN users u ON c.issued_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (document_type) {
    query += ' AND c.document_type = ?';
    params.push(document_type);
  }

  if (search) {
    query += ' AND (c.candidate_name LIKE ? OR c.certificate_number LIKE ? OR c.course_or_domain LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY c.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

// 3. Get Certificate Details by ID
export const getCertificateById = async (id) => {
  const [rows] = await pool.query(
    `SELECT c.*, u.full_name as issued_by_name 
     FROM certificates c
     LEFT JOIN users u ON c.issued_by = u.id
     WHERE c.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return rows[0];
};

// 4. Public Verification Endpoint (Verify via Serial Number)
export const verifyCertificate = async (certificateNumber) => {
  const [rows] = await pool.query(
    'SELECT certificate_number, candidate_name, document_type, course_or_domain, issue_date, status FROM certificates WHERE certificate_number = ?',
    [certificateNumber]
  );

  if (rows.length === 0) {
    return { verified: false, message: 'Invalid certificate or document number' };
  }

  return { verified: true, data: rows[0] };
};

// 5. HTML Preview Template Generator (Ready to Print / Save to PDF)
export const getCertificateHtml = async (id) => {
  const cert = await getCertificateById(id);

  let templateHtml = '';

  if (cert.document_type === 'Internship Certificate' || cert.document_type === 'Experience Letter' || cert.document_type === 'Course Certificate') {
    templateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${cert.document_type} - ${cert.candidate_name}</title>
        <style>
          body { font-family: 'Georgia', serif; background: #f3f4f6; margin: 0; padding: 40px; display: flex; justify-content: center; }
          .certificate { width: 850px; background: white; padding: 50px; border: 8px double #1e3a8a; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
          .sublogo { font-size: 14px; color: #6b7280; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 28px; color: #111827; margin: 20px 0; text-transform: uppercase; font-weight: bold; }
          .subtitle { font-size: 16px; color: #4b5563; }
          .candidate-name { font-size: 34px; color: #1e3a8a; font-weight: bold; margin: 25px 0; border-bottom: 2px solid #e5e7eb; display: inline-block; padding: 0 40px 10px; }
          .body-text { font-size: 18px; color: #374151; line-height: 1.6; max-width: 700px; margin: 0 auto; }
          .highlight { font-weight: bold; color: #111827; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 30px; }
          .sign { border-top: 1px solid #9ca3af; width: 180px; padding-top: 5px; font-size: 14px; color: #4b5563; }
          .cert-id { position: absolute; bottom: 15px; left: 50px; font-size: 12px; color: #9ca3af; }
          @media print { body { padding: 0; background: none; } .certificate { box-shadow: none; border: 4px double #1e3a8a; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">HERTZSOFT TECHNOLOGIES</div>
          <div class="sublogo">Enterprise Software Development & Digital Solutions</div>
          <div class="title">${cert.document_type}</div>
          <div class="subtitle">This is proudly presented to</div>
          <div class="candidate-name">${cert.candidate_name}</div>
          <div class="body-text">
            For successfully completing the corporate internship and software engineering requirements in 
            <span class="highlight">${cert.course_or_domain}</span> with a performance rating of 
            <span class="highlight">${cert.performance_rating}</span>.
          </div>
          <div class="footer">
            <div class="sign">Issue Date: <strong>${new Date(cert.issue_date).toLocaleDateString()}</strong></div>
            <div class="sign">Authorized Signatory<br><strong>Hertzsoft Technologies</strong></div>
          </div>
          <div class="cert-id">Verification ID: ${cert.certificate_number}</div>
        </div>
      </body>
      </html>
    `;
  } else if (cert.document_type === 'Appointment Letter') {
    templateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Letter - ${cert.candidate_name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 40px; display: flex; justify-content: center; }
          .letter { width: 750px; background: white; padding: 50px 60px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); line-height: 1.6; color: #1f2937; position: relative; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; }
          .tagline { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta { font-size: 12px; color: #475569; text-align: right; }
          .title-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; border: 1px solid #bfdbfe; }
          .salutation { font-size: 15px; font-weight: 700; margin-bottom: 15px; }
          .content { font-size: 14px; margin-bottom: 16px; text-align: justify; }
          .highlight { font-weight: 700; color: #1e3a8a; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 13px; }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-val { font-weight: 700; color: #0f172a; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sign-block { font-size: 13px; color: #475569; }
          .verify-pill { font-size: 11px; color: #94a3b8; font-family: monospace; }
          @media print { body { padding: 0; background: none; } .letter { box-shadow: none; padding: 30px; } }
        </style>
      </head>
      <body>
        <div class="letter">
          <div class="header">
            <div>
              <div class="logo">HERTZSOFT TECHNOLOGIES</div>
              <div class="tagline">Enterprise Software Development & Digital Solutions</div>
            </div>
            <div class="meta">
              <strong>Date:</strong> ${new Date(cert.issue_date).toLocaleDateString('en-GB')}<br>
              <strong>Ref No:</strong> ${cert.certificate_number}
            </div>
          </div>

          <div class="title-badge">Letter of Appointment</div>

          <div class="salutation">To: ${cert.candidate_name}</div>

          <div class="content">
            We are pleased to formally confirm your appointment at <strong>Hertzsoft Technologies</strong> as a <span class="highlight">${cert.course_or_domain}</span>. This letter confirms your technical engagement, responsibilities, and official tenure with our software engineering operations.
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Appointee Name:</span>
              <span class="info-val">${cert.candidate_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Designation / Role:</span>
              <span class="info-val">${cert.course_or_domain}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Effective Date of Appointment:</span>
              <span class="info-val">${cert.start_date ? new Date(cert.start_date).toLocaleDateString('en-GB') : new Date(cert.issue_date).toLocaleDateString('en-GB')}</span>
            </div>
            ${cert.end_date ? `
            <div class="info-row">
              <span class="info-label">Scheduled Completion / Tenure:</span>
              <span class="info-val">${new Date(cert.end_date).toLocaleDateString('en-GB')}</span>
            </div>` : ''}
            ${cert.stipend ? `
            <div class="info-row">
              <span class="info-label">Monthly Compensation / Stipend:</span>
              <span class="info-val">INR ${Number(cert.stipend).toLocaleString('en-IN')}/- per month</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">Verification Serial ID:</span>
              <span class="info-val">${cert.certificate_number}</span>
            </div>
          </div>

          <div class="content">
            <strong>Official Academic / Administrative Note:</strong> This document is issued upon request to serve as authentic proof of appointment for university, college, educational institution submissions, academic NOC approvals, or other administrative verification purposes.
          </div>

          <div class="content">
            We look forward to your valuable contributions, innovation, and continued dedication towards our engineering milestones and client deliverables.
          </div>

          <div class="footer">
            <div class="sign-block">
              Sincerely,<br><br>
              <strong>Director of Human Resources & Operations</strong><br>
              Hertzsoft Technologies
            </div>
            <div class="verify-pill">
              Verify ID: ${cert.certificate_number}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // Offer Letter Template
    templateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offer Letter - ${cert.candidate_name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 40px; display: flex; justify-content: center; }
          .letter { width: 750px; background: white; padding: 60px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); line-height: 1.6; color: #333; }
          .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .company-name { font-size: 26px; font-weight: bold; color: #1e3a8a; }
          .meta { font-size: 13px; color: #6b7280; text-align: right; }
          .salutation { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
          .content { font-size: 15px; margin-bottom: 20px; }
          .highlight { font-weight: bold; color: #1e3a8a; }
          .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 0; background: none; } .letter { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="letter">
          <div class="header">
            <div class="company-name">HERTZSOFT TECHNOLOGIES</div>
            <div class="meta">
              Date: ${new Date(cert.issue_date).toLocaleDateString()}<br>
              Ref: ${cert.certificate_number}
            </div>
          </div>
          <div class="salutation">Dear ${cert.candidate_name},</div>
          <div class="content">
            We are pleased to offer you the position of <span class="highlight">${cert.course_or_domain}</span> at Hertzsoft Technologies.
          </div>
          <div class="content">
            Your joining date will be <strong>${cert.start_date ? new Date(cert.start_date).toLocaleDateString() : 'As mutually agreed'}</strong>. 
            ${cert.stipend ? `You will receive a stipend/compensation of <strong>${cert.stipend}</strong> during this tenure.` : ''}
          </div>
          <div class="content">
            We are confident that you will bring great energy and technical innovation to our teams and projects.
          </div>
          <div class="footer">
            Sincerely,<br>
            <strong>HR Operations</strong><br>
            Hertzsoft Technologies
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return templateHtml;
};
