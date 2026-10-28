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

async function runProjectsAndPaymentsSuite() {
  console.log(`\n${colors.bright}${colors.cyan}===============================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  HERTZSOFT ERP — AUTOMATED PROJECTS & PAYMENTS TEST SUITE     ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  Target: ${BASE_URL}                                          ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}===============================================================${colors.reset}\n`);

  let authToken = null;
  let clientId = null;
  let projectId = null;
  let passedCount = 0;
  let failedCount = 0;

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
    // STEP 1: Administrator Authentication
    // ------------------------------------------------------------------------
    logSection('1. Authentication & Admin Session');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@hertzsoft.com',
        password: 'Password123@'
      })
    });

    const token = loginRes.data?.data?.token || loginRes.data?.token;
    assert(loginRes.ok && !!token, 'Login as Administrator', `User: admin@hertzsoft.com`);
    authToken = token;

    if (!authToken) {
      throw new Error('Authentication failed. Aborting further tests.');
    }

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // ------------------------------------------------------------------------
    // STEP 2: Client Management Lifecycle
    // ------------------------------------------------------------------------
    logSection('2. Client Management Lifecycle');
    const clientPayload = {
      name: `Apex Cloud Solutions_${Date.now()}`,
      company_name: 'Apex Cloud Solutions Inc',
      email: `finance_${Date.now()}@apexcloud.io`,
      phone: '+91 98111 22334',
      primary_contact_name: 'Vikram Merchant'
    };

    const createClientRes = await request('/api/clients', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(clientPayload)
    });

    clientId = createClientRes.data?.data?.id;
    assert(createClientRes.ok && !!clientId, 'Create Enterprise Client Profile', `ID: ${clientId}`);

    // Verify Fetch Clients
    const getClientsRes = await request('/api/clients', { headers: authHeaders });
    const clientExists = Array.isArray(getClientsRes.data?.data) && getClientsRes.data.data.some(c => c.id === clientId);
    assert(clientExists, 'Fetch Clients List & Verify Persistence', `Total Clients: ${getClientsRes.data?.data?.length}`);

    // ------------------------------------------------------------------------
    // STEP 3: Project Creation & Initial Balance
    // ------------------------------------------------------------------------
    logSection('3. Project Creation & Financial Ledger Initialization');
    const totalContractValue = 300000.00; // ₹3,00,000

    const projectPayload = {
      client_id: clientId,
      title: 'Apex Cloud Distributed Warehouse ERP',
      description: 'End-to-end cloud logistics tracking, order fulfillment, and automated invoice system.',
      total_cost: totalContractValue,
      start_date: '2026-11-01',
      target_end_date: '2027-02-28',
      status: 'In Progress'
    };

    const createProjectRes = await request('/api/projects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(projectPayload)
    });

    projectId = createProjectRes.data?.data?.id;
    assert(createProjectRes.ok && !!projectId, 'Create Project Linked to Client', `Contract Value: ₹3,00,000.00 | Project ID: ${projectId}`);

    // Verify Project Details & Initial Dues
    const initialProjectRes = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    const pData = initialProjectRes.data?.data;
    const initialPaid = Number(pData?.total_paid || 0);
    const initialDue = Number(pData?.due_balance);

    assert(initialProjectRes.ok, 'Fetch Single Project by ID');
    assert(initialPaid === 0, 'Initial Paid Amount is Exactly ₹0.00', `Actual: ₹${initialPaid}`);
    assert(initialDue === totalContractValue, 'Initial Due Balance matches 100% Contract Value', `Due: ₹${initialDue}`);

    // ------------------------------------------------------------------------
    // STEP 4: Installment 1 — Advance Milestone (₹1,00,000 via UPI)
    // ------------------------------------------------------------------------
    logSection('4. Payment Installment 1 — Advance Milestone');
    const pay1Res = await request('/api/payments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        project_id: projectId,
        amount_paid: 100000.00,
        payment_method: 'UPI',
        transaction_reference: 'UPI/HDFC/20261028/891276',
        notes: 'Initial 33.3% project kickoff installment'
      })
    });

    assert(pay1Res.ok, 'Record Payment 1 (₹1,00,000 via UPI)', `Ref: UPI/HDFC/20261028/891276`);

    // Verify Auto Due Balance Update
    const afterPay1 = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    const pData1 = afterPay1.data?.data;
    assert(Number(pData1?.total_paid) === 100000, 'Project Total Paid Updated to ₹1,00,000', `Actual: ₹${pData1?.total_paid}`);
    assert(Number(pData1?.due_balance) === 200000, 'Project Due Balance Automatically Reduced to ₹2,00,000', `Actual: ₹${pData1?.due_balance}`);

    // ------------------------------------------------------------------------
    // STEP 5: Installment 2 — Mid-term Milestone (₹1,50,000 via Bank Transfer)
    // ------------------------------------------------------------------------
    logSection('5. Payment Installment 2 — Mid-term Milestone');
    const pay2Res = await request('/api/payments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        project_id: projectId,
        amount_paid: 150000.00,
        payment_method: 'Bank Transfer',
        transaction_reference: 'NEFT/ICICI/20261115/004812',
        notes: 'Milestone 2: Database architecture & Core API delivery'
      })
    });

    assert(pay2Res.ok, 'Record Payment 2 (₹1,50,000 via Bank Transfer)', `Ref: NEFT/ICICI/20261115/004812`);

    // Verify Auto Due Balance Update
    const afterPay2 = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    const pData2 = afterPay2.data?.data;
    assert(Number(pData2?.total_paid) === 250000, 'Project Total Paid Accumulated to ₹2,50,000', `Actual: ₹${pData2?.total_paid}`);
    assert(Number(pData2?.due_balance) === 50000, 'Project Due Balance Automatically Reduced to ₹50,000', `Actual: ₹${pData2?.due_balance}`);

    // ------------------------------------------------------------------------
    // STEP 6: Installment 3 — Final Settlement (₹50,000 via Cheque)
    // ------------------------------------------------------------------------
    logSection('6. Payment Installment 3 — Final Settlement (Full Clearance)');
    const pay3Res = await request('/api/payments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        project_id: projectId,
        amount_paid: 50000.00,
        payment_method: 'Cheque',
        transaction_reference: 'CHQ-991204-AXIS',
        notes: 'Final settlement on UAT acceptance and go-live'
      })
    });

    assert(pay3Res.ok, 'Record Payment 3 (₹50,000 via Cheque)', `Ref: CHQ-991204-AXIS`);

    // Verify 100% Cleared Dues
    const afterPay3 = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    const pData3 = afterPay3.data?.data;
    assert(Number(pData3?.total_paid) === 300000, 'Project Total Paid Reached 100% (₹3,00,000)', `Actual: ₹${pData3?.total_paid}`);
    assert(Number(pData3?.due_balance) === 0, 'Project Due Balance Cleared to ₹0.00', `Actual: ₹${pData3?.due_balance}`);

    // ------------------------------------------------------------------------
    // STEP 7: Project Update & Completion
    // ------------------------------------------------------------------------
    logSection('7. Project Status Update to Completed');
    const updateRes = await request(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Apex Cloud Distributed Warehouse ERP [Delivered]',
        status: 'Completed'
      })
    });

    assert(updateRes.ok, 'Update Project Status to "Completed"');

    const finalProjectRes = await request(`/api/projects/${projectId}`, { headers: authHeaders });
    assert(finalProjectRes.data?.data?.status === 'Completed', 'Verify Final Status is "Completed" in Database');

    // ------------------------------------------------------------------------
    // STEP 8: Overall Financial Dashboard Reconciliation
    // ------------------------------------------------------------------------
    logSection('8. Financial Dashboard Stats & Collections Ledger');
    const finSummary = await request('/api/payments/summary', { headers: authHeaders });
    assert(finSummary.ok && Number(finSummary.data?.data?.total_collected) >= 300000, 'Financial Summary Aggregates All Payments Accurately', `Total Collected in System: ₹${finSummary.data?.data?.total_collected}`);

    const dashboardStats = await request('/api/dashboard/stats', { headers: authHeaders });
    const statsData = dashboardStats.data?.data;
    assert(dashboardStats.ok, 'Dashboard Stats Endpoint Returns Real-time Consolidated Metrics');
    assert(Number(statsData?.financials?.total_collected) >= 300000, 'Dashboard Financials Reflect New Collections', `Collected: ₹${statsData?.financials?.total_collected}`);

    // ------------------------------------------------------------------------
    // FINAL REPORT
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bright}${colors.cyan}===============================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED        ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}===============================================================${colors.reset}\n`);

    if (failedCount === 0) {
      console.log(`  ${colors.bright}${colors.green}🎉 ALL PROJECTS & PAYMENTS TESTS PASSED WITH 100% SUCCESS!${colors.reset}\n`);
    } else {
      console.log(`  ${colors.bright}${colors.red}⚠️ Some tests failed. Check log above.${colors.reset}\n`);
    }

  } catch (err) {
    console.error(`\n${colors.red}CRITICAL TEST ERROR: ${err.message}${colors.reset}\n`);
    process.exit(1);
  }
}

runProjectsAndPaymentsSuite();
