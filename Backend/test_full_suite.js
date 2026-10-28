import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const logPass = (title, details = '') => {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${title} ${details ? colors.cyan + '(' + details + ')' + colors.reset : ''}`);
};

const logFail = (title, error) => {
  console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${title}`);
  if (error) console.error(`    ${colors.red}Reason: ${error}${colors.reset}`);
};

const logSection = (name) => {
  console.log(`\n${colors.bright}${colors.blue}=== ${name} ===${colors.reset}`);
};

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${err.message}`);
  }
};

async function runMasterTestSuite() {
  console.log(`\n${colors.bright}${colors.magenta}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}    HERTZSOFT ERP — MASTER END-TO-END AUTOMATED TEST SUITE      ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}    Target: ${BASE_URL}                                         ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}================================================================${colors.reset}\n`);

  let passedCount = 0;
  let failedCount = 0;
  let authToken = null;

  const assert = (condition, title, details = '') => {
    if (condition) {
      logPass(title, details);
      passedCount++;
    } else {
      logFail(title, details);
      failedCount++;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // 1. Health & Core Connectivity
    // ------------------------------------------------------------------------
    logSection('1. Health Check & Connectivity');
    const healthRes = await request('/health');
    assert(healthRes.ok && healthRes.data?.success === true, 'Server Health Endpoint Check', `Status: ${healthRes.status}`);

    // ------------------------------------------------------------------------
    // 2. Authentication & Admin Token
    // ------------------------------------------------------------------------
    logSection('2. Authentication & Admin Authorization');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@hertzsoft.com',
        password: 'Password123@'
      })
    });

    authToken = loginRes.data?.data?.token || loginRes.data?.token;
    assert(loginRes.ok && !!authToken, 'Admin Login Authentication', `Admin: admin@hertzsoft.com`);

    if (!authToken) {
      throw new Error('Fatal: Authentication failed. Aborting remaining tests.');
    }

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // ------------------------------------------------------------------------
    // 3. Consolidated Dashboard Metrics (Pure B2B / No Student Concept)
    // ------------------------------------------------------------------------
    logSection('3. Dashboard API & Pure B2B Metrics');
    const dashRes = await request('/api/dashboard/stats', { headers: authHeaders });
    assert(dashRes.ok, 'Dashboard Metrics Fetched', `Status: ${dashRes.status}`);

    const dashData = dashRes.data?.data || dashRes.data;
    assert(typeof dashData?.leads?.total === 'number', 'Dashboard total leads metric exists', `Count: ${dashData?.leads?.total}`);
    assert(typeof dashData?.leads?.won === 'number', 'Dashboard won deals metric exists', `Won: ${dashData?.leads?.won}`);
    assert(typeof dashData?.leads?.lost === 'number', 'Dashboard lost deals metric exists', `Lost: ${dashData?.leads?.lost}`);
    assert(typeof dashData?.leads?.active_pipeline === 'number', 'Dashboard active pipeline metric exists', `Active: ${dashData?.leads?.active_pipeline}`);
    assert(dashData?.leads?.student_leads === undefined, 'Student concept strictly absent from leads metrics');
    assert(typeof dashData?.financials?.total_deal_value === 'number', 'Financials total deal value calculated', `Value: ₹${dashData?.financials?.total_deal_value}`);
    assert(typeof dashData?.documents?.total_certificates_issued === 'number', 'Documents issued count valid', `Count: ${dashData?.documents?.total_certificates_issued}`);

    // ------------------------------------------------------------------------
    // 4. Leads & Pipeline Management
    // ------------------------------------------------------------------------
    logSection('4. Leads & Deals Pipeline Management');
    const newLeadPayload = {
      name: 'Vikas Malhotra',
      phone: `98200${Math.floor(10000 + Math.random() * 90000)}`,
      email: `vikas_${Date.now()}@fintechglobal.in`,
      company_name: 'FinTech Global Systems',
      service_interest: 'Enterprise Custom ERP & Cloud DevOps',
      estimated_budget: 450000,
      priority: 'High',
      source: 'Direct Client Inquiry'
    };

    const createLeadRes = await request('/api/leads', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newLeadPayload)
    });

    const createdLead = createLeadRes.data?.data || createLeadRes.data;
    assert(createLeadRes.ok && !!createdLead?.id, 'Create B2B Client Inquiry Lead', `Company: ${createdLead?.company_name}`);
    assert(createdLead?.lead_type === 'Client', 'Lead defaulted to Client stream (No student concept)');
    const leadId = createdLead?.id;

    // Status transition to 'In Discussion'
    const statusInDiscRes = await request(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'In Discussion' })
    });
    assert(statusInDiscRes.ok, "Lead status updated to 'In Discussion'");

    // Status transition to 'Won'
    const statusWonRes = await request(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Won' })
    });
    assert(statusWonRes.ok, "Lead status updated to 'Won'");

    // Create another lead and mark as 'Lost' with lost_reason modal test
    const lostLeadPayload = {
      name: 'Ramesh Patel',
      phone: `98300${Math.floor(10000 + Math.random() * 90000)}`,
      email: `ramesh_${Date.now()}@zenithretail.com`,
      company_name: 'Zenith Retail Outlets',
      service_interest: 'Mobile App Development (iOS & Android)',
      estimated_budget: 180000,
      priority: 'Normal'
    };

    const createLostLeadRes = await request('/api/leads', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(lostLeadPayload)
    });
    const lostLeadId = (createLostLeadRes.data?.data || createLostLeadRes.data)?.id;
    assert(createLostLeadRes.ok && !!lostLeadId, 'Create Second Lead for Lost Transition');

    const statusLostRes = await request(`/api/leads/${lostLeadId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Lost',
        lost_reason: 'Budget / Fees Constraint - Client chose in-house team'
      })
    });
    assert(statusLostRes.ok, "Lead status updated to 'Lost' with custom reason");

    // ------------------------------------------------------------------------
    // 5. Corporate Certificates & HR Documents Registry
    // ------------------------------------------------------------------------
    logSection('5. Corporate Credentials & HR Documents Registry');

    // 5.1 Issue Offer Letter
    const offerPayload = {
      document_type: 'Offer Letter',
      candidate_name: 'Pooja Verma',
      candidate_email: 'pooja.verma@example.com',
      candidate_phone: '+91 99201 11223',
      course_or_domain: 'FullStack Software Engineer',
      start_date: '2026-11-01',
      issue_date: '2026-10-28',
      stipend: 35000,
      performance_rating: 'Outstanding (A+)'
    };

    const issueOfferRes = await request('/api/certificates', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(offerPayload)
    });
    const createdOffer = issueOfferRes.data?.data || issueOfferRes.data;
    assert(issueOfferRes.ok && !!createdOffer?.certificate_number, 'Issue Official Offer Letter', `Serial: ${createdOffer?.certificate_number}`);

    // 5.2 Issue Internship Certificate
    const internPayload = {
      document_type: 'Internship Certificate',
      candidate_name: 'Aditya Singhal',
      candidate_email: 'aditya.singhal@example.com',
      candidate_phone: '+91 98112 33445',
      course_or_domain: 'Cloud & DevOps Engineer',
      start_date: '2026-05-01',
      end_date: '2026-10-25',
      issue_date: '2026-10-28',
      performance_rating: 'Excellent (A)'
    };

    const issueInternRes = await request('/api/certificates', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(internPayload)
    });
    const createdIntern = issueInternRes.data?.data || issueInternRes.data;
    assert(issueInternRes.ok && !!createdIntern?.certificate_number, 'Issue Official Internship Certificate', `Serial: ${createdIntern?.certificate_number}`);

    // 5.3 Issue Experience Letter
    const expPayload = {
      document_type: 'Experience Letter',
      candidate_name: 'Karan Mehra',
      candidate_email: 'karan.mehra@example.com',
      candidate_phone: '+91 97665 44332',
      course_or_domain: 'Backend Developer (Node.js/Python)',
      start_date: '2025-01-15',
      end_date: '2026-10-15',
      issue_date: '2026-10-28',
      performance_rating: 'Very Good (B+)'
    };

    const issueExpRes = await request('/api/certificates', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(expPayload)
    });
    const createdExp = issueExpRes.data?.data || issueExpRes.data;
    assert(issueExpRes.ok && !!createdExp?.certificate_number, 'Issue Official Experience Letter', `Serial: ${createdExp?.certificate_number}`);

    // 5.4 Fetch All Certificates
    const allCertsRes = await request('/api/certificates', { headers: authHeaders });
    const certList = allCertsRes.data?.data || allCertsRes.data || [];
    assert(allCertsRes.ok && Array.isArray(certList), 'Fetch Certificates Registry List', `Total Records: ${certList.length}`);

    // 5.5 Verify serial numbers publicly
    const verifyRes = await request(`/api/certificates/verify/${createdOffer?.certificate_number}`);
    assert(verifyRes.ok && (verifyRes.data?.verified === true || verifyRes.data?.data?.status === 'Active'), 'Public Serial Verification Check', `ID: ${createdOffer?.certificate_number}`);

    // 5.6 Preview HTML template
    const previewRes = await request(`/api/certificates/${createdIntern?.id}/preview`, { headers: authHeaders });
    assert(previewRes.ok && typeof previewRes.data === 'string' && previewRes.data.includes('HERTZSOFT TECHNOLOGIES'), 'Certificate HTML Preview Generation');

    // ------------------------------------------------------------------------
    // 6. Projects & Payments Lifecycle
    // ------------------------------------------------------------------------
    logSection('6. Projects & Milestone Payments Lifecycle');

    // 6.1 Create Client
    const clientRes = await request('/api/clients', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Quantum Systems Pvt Ltd_${Date.now()}`,
        company_name: 'Quantum Systems',
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        email: `contact_${Date.now()}@quantumsystems.io`
      })
    });
    const clientId = (clientRes.data?.data || clientRes.data)?.id;
    assert(clientRes.ok && !!clientId, 'Create Corporate Client for Project Contract');

    // 6.2 Create Project
    const projectRes = await request('/api/projects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        client_id: clientId,
        title: 'Enterprise Cloud ERP & Real-Time Sync',
        total_cost: 200000,
        deadline: '2026-12-31'
      })
    });
    const projectId = (projectRes.data?.data || projectRes.data)?.id;
    assert(projectRes.ok && !!projectId, 'Create Project Contract (₹2,00,000 Total Value)');

    // 6.3 Record Installment Payment
    const paymentRes = await request('/api/payments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        project_id: projectId,
        client_id: clientId,
        amount_paid: 120000,
        payment_method: 'Bank Transfer',
        transaction_reference: `NEFT-TXN-${Date.now()}`,
        notes: 'Enterprise contract milestone 1 payment'
      })
    });
    assert(paymentRes.ok, 'Record Payment Installment (₹1,20,000 Bank Transfer)');

    // 6.4 Verify Project Balance Update
    const projectDetailRes = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    const pDetail = projectDetailRes.data?.data || projectDetailRes.data;
    const dueBalance = Number(pDetail?.due_balance);
    assert(dueBalance === 80000, 'Project Pending Due Reconciled', `Remaining Due: ₹${dueBalance}`);

  } catch (err) {
    console.error(`\n${colors.red}Unhandled Test Suite Exception: ${err.message}${colors.reset}`);
    failedCount++;
  }

  // Final Summary
  console.log(`\n${colors.bright}================================================================${colors.reset}`);
  console.log(`${colors.bright}                  FINAL TEST SUITE SUMMARY                     ${colors.reset}`);
  console.log(`${colors.bright}================================================================${colors.reset}`);
  console.log(`  ${colors.green}Total Passed: ${passedCount}${colors.reset}`);
  console.log(`  ${failedCount > 0 ? colors.red : colors.green}Total Failed: ${failedCount}${colors.reset}`);
  const passRate = ((passedCount / (passedCount + failedCount || 1)) * 100).toFixed(1);
  console.log(`  ${colors.bright}Success Rate: ${passRate}%${colors.reset}`);
  console.log(`${colors.bright}================================================================\n${colors.reset}`);

  process.exit(failedCount === 0 ? 0 : 1);
}

runMasterTestSuite();
