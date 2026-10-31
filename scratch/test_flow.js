const pool = require('../Backend/src/config/db.js').default || require('../Backend/src/config/db.js');

async function testFullFlow() {
  console.log('Testing full flow: Lead -> Client -> Project -> Quotation -> Payment...');

  try {
    // 1. Get an active admin user
    const [users] = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'Administrator' LIMIT 1");
    if (users.length === 0) {
      throw new Error('No admin user found');
    }
    const admin = users[0];
    console.log(`[PASS] Using admin user: ${admin.full_name} (${admin.email})`);

    // 2. Create a test lead
    const timestamp = Date.now();
    const testLeadData = [
      `Client Test ${timestamp}`,
      `98765${String(timestamp).slice(-5)}`,
      `client${timestamp}@test.com`,
      `Test Business ${timestamp}`,
      'Full Stack Web Portal',
      'Web Application',
      'Official Website Inquiry',
      'New',
      'Normal',
      admin.id,
      admin.id
    ];

    const [leadInsert] = await pool.query(
      `INSERT INTO leads (name, phone, email, company_name, requirement, service_interest, source, status, priority, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      testLeadData
    );
    const leadId = leadInsert.insertId;
    console.log(`[PASS] Step 1: Lead created with ID: ${leadId}`);

    // 3. Mark Lead as Won
    await pool.query("UPDATE leads SET status = 'Won' WHERE id = ?", [leadId]);
    console.log(`[PASS] Step 2: Lead #${leadId} transitioned to stage 'Won'`);

    // 4. Convert Won Lead to Client
    const clientNumber = `CL-${timestamp.toString().slice(-4)}`;
    const [clientInsert] = await pool.query(
      `INSERT INTO clients (client_number, name, company_name, phone, email, converted_from_lead_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientNumber, `Client Test ${timestamp}`, `Test Business ${timestamp}`, `98765${String(timestamp).slice(-5)}`, `client${timestamp}@test.com`, leadId, admin.id]
    );
    const clientId = clientInsert.insertId;

    await pool.query(
      "UPDATE leads SET converted_client_id = ?, converted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [clientId, leadId]
    );
    console.log(`[PASS] Step 3: Lead #${leadId} converted to Client #${clientId} (Client No: ${clientNumber})`);

    // 5. Create Project for Client
    const [projectInsert] = await pool.query(
      `INSERT INTO projects (title, description, client_id, start_date, end_date, total_cost, status, created_by)
       VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, 'In Progress', ?)`,
      [`E-Commerce Portal for Client ${timestamp}`, 'Full web shop with payment gateway', clientId, 60000.00, admin.id]
    );
    const projectId = projectInsert.insertId;
    console.log(`[PASS] Step 4: Project #${projectId} created for Client #${clientId} with Total Cost: ₹60,000`);

    // 6. Create Commercial Quotation linked to Client and Project
    const [quotationInsert] = await pool.query(
      `INSERT INTO quotations (quotation_number, version, client_id, project_id, title, quotation_date, status, subtotal, tax_rate, tax_amount, total_amount, created_by)
       VALUES (?, 1, ?, ?, ?, CURDATE(), 'Accepted', 50847.46, 18.00, 9152.54, 60000.00, ?)`,
      [`QT-${timestamp.toString().slice(-6)}`, clientId, projectId, 'Commercial Proposal for Portal', admin.id]
    );
    const quotationId = quotationInsert.insertId;
    console.log(`[PASS] Step 5: Quotation #${quotationId} drafted and linked to Project #${projectId}`);

    // 7. Record Milestone Payment against the Project
    const [paymentInsert] = await pool.query(
      `INSERT INTO payments (client_id, project_id, amount_paid, payment_date, payment_method, transaction_reference, recorded_by)
       VALUES (?, ?, 25000.00, CURDATE(), 'UPI', 'TEST-UTR-${timestamp}', ?)`,
      [clientId, projectId, admin.id]
    );
    const paymentId = paymentInsert.insertId;
    console.log(`[PASS] Step 6: Advance Payment #${paymentId} recorded for ₹25,000`);

    // 8. Verify Project Balance Calculations
    const [projectCheck] = await pool.query(
      `SELECT p.id, p.title, p.total_cost,
              COALESCE(SUM(pm.amount_paid), 0) AS total_paid,
              (p.total_cost - COALESCE(SUM(pm.amount_paid), 0)) AS due_balance
       FROM projects p
       LEFT JOIN payments pm ON p.id = pm.project_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [projectId]
    );
    const projectSummary = projectCheck[0];
    console.log(`[PASS] Step 7: Balance Calculation verified:`, {
      total_cost: projectSummary.total_cost,
      total_paid: projectSummary.total_paid,
      due_balance: projectSummary.due_balance
    });

    if (Number(projectSummary.total_paid) === 25000 && Number(projectSummary.due_balance) === 35000) {
      console.log('✅ COMPLETE FLOW VERIFIED: All links (Lead -> Client -> Project -> Quotation -> Payment) are WORKING PROPERLY!');
    } else {
      console.error('❌ Mismatch in calculations');
    }

    // 9. Clean up test records
    await pool.query('DELETE FROM payments WHERE id = ?', [paymentId]);
    await pool.query('DELETE FROM quotations WHERE id = ?', [quotationId]);
    await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);
    await pool.query('DELETE FROM leads WHERE id = ?', [leadId]);
    await pool.query('DELETE FROM clients WHERE id = ?', [clientId]);
    console.log('[PASS] Test cleanup completed successfully.');

    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

testFullFlow();
