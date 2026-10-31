import pool from '../Backend/src/config/db.js';
import * as leadService from '../Backend/src/modules/lead.service.js';
import * as projectService from '../Backend/src/modules/project.service.js';
import * as quotationService from '../Backend/src/modules/quotation.service.js';
import * as paymentService from '../Backend/src/modules/payment.service.js';

async function testFullFlow() {
  console.log('Testing complete application flow using backend services...');

  try {
    // 1. Get an active user
    const [users] = await pool.query("SELECT id, full_name, email FROM users LIMIT 1");
    if (users.length === 0) throw new Error('No user found');
    const admin = users[0];
    console.log(`[PASS] Logged in as: ${admin.full_name} (${admin.id})`);

    const timestamp = Date.now();

    // 2. Step 1: Create a Lead
    console.log('\n--- STEP 1: Creating Lead ---');
    const leadPayload = {
      lead_type: 'Client',
      name: `Ramesh Verma ${timestamp}`,
      phone: `98765${String(timestamp).slice(-5)}`,
      email: `ramesh${timestamp}@hertzsoft-test.com`,
      company_name: `Verma Enterprises ${timestamp}`,
      requirement: 'Enterprise ERP & Operations Portal',
      service_interest: 'Custom Web Application & ERP',
      source: 'Official Website Inquiry',
      status: 'New',
      priority: 'Normal',
      assigned_to: admin.id
    };

    const createdLead = await leadService.createLead(leadPayload, admin.id);
    console.log(`[PASS] Lead Created successfully! ID: ${createdLead.id}, Number: #${createdLead.lead_number}, Name: ${createdLead.name}`);

    // 3. Step 2: Transition Lead Stage to Won
    console.log('\n--- STEP 2: Progressing Pipeline to "Won" ---');
    const wonLead = await leadService.updateLeadStatus(createdLead.id, { status: 'Won' });
    console.log(`[PASS] Lead stage updated to: ${wonLead.status}`);

    // 4. Step 3: Convert Won Lead to Client
    console.log('\n--- STEP 3: Converting Lead to Client ---');
    const conversionResult = await leadService.convertLeadToClient(createdLead.id, {
      billing_address: 'Andheri West, Mumbai, Maharashtra'
    }, admin.id);
    const client = conversionResult.client;
    console.log(`[PASS] Lead converted to Client #${client.client_number}! Client ID: ${client.id}`);

    // 5. Step 4: Create Project Contract for Client
    console.log('\n--- STEP 4: Creating Project for Client ---');
    const projectPayload = {
      title: `Hertzsoft ERP Portal for ${client.company_name}`,
      description: 'End-to-end Enterprise Resource Planning portal',
      client_id: client.id,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      total_cost: 75000.00,
      status: 'In Progress'
    };
    const createdProject = await projectService.createProject(projectPayload, admin.id);
    console.log(`[PASS] Project created successfully! ID: ${createdProject.id}, Title: "${createdProject.title}", Cost: ₹${createdProject.total_cost}`);

    // 6. Step 5: Draft Commercial Quotation
    console.log('\n--- STEP 5: Drafting Quotation for Client & Project ---');
    const quotationPayload = {
      client_id: client.id,
      project_id: createdProject.id,
      title: 'Commercial Proposal for ERP Deployment',
      items: [
        { description: 'ERP Core Modules Setup & Database Architecture', quantity: 1, rate: 45000, discount_percent: 0, tax_percent: 18 },
        { description: 'Automated Billing & Reporting Module', quantity: 1, rate: 18559.32, discount_percent: 0, tax_percent: 18 }
      ],
      discount_rate: 0,
      tax_rate: 18.00
    };
    const createdQuotation = await quotationService.createQuotation(quotationPayload, admin.id);
    console.log(`[PASS] Quotation drafted! Number: ${createdQuotation.quotation_number}, Subtotal: ₹${createdQuotation.subtotal}, Total Amount: ₹${createdQuotation.total_amount}`);

    // 7. Step 6: Record Advance Milestone Payment
    console.log('\n--- STEP 6: Recording Milestone Payment ---');
    const paymentPayload = {
      project_id: createdProject.id,
      amount_paid: 35000.00,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'Bank Transfer (NEFT/RTGS)',
      transaction_reference: `UTR-HDFC-${timestamp}`,
      notes: 'Initial 50% project kickoff milestone payment'
    };
    const createdPayment = await paymentService.recordPayment(paymentPayload, admin.id);
    console.log(`[PASS] Payment recorded! ID: ${createdPayment.id}, Amount: ₹${createdPayment.amount_paid}, Receipt: ${createdPayment.receipt_number || 'Generated'}`);

    // 8. Step 7: Verify Project Financials & Linkages
    console.log('\n--- STEP 7: Verifying Financial Analytics & Balances ---');
    const projectDetails = await projectService.getProjectById(createdProject.id);
    console.log(`[PASS] Project Cost: ₹${projectDetails.total_cost}`);
    console.log(`[PASS] Project Total Paid: ₹${projectDetails.total_paid}`);
    console.log(`[PASS] Project Due Balance: ₹${projectDetails.due_balance}`);

    if (Number(projectDetails.total_paid) === 35000 && Number(projectDetails.due_balance) === 40000) {
      console.log('\n🎉 ALL CHECKS PASSED: The entire Lead -> Client -> Project -> Quotation -> Payment flow is 100% OPERATIONAL!');
    } else {
      throw new Error(`Balance calculation mismatch: paid=${projectDetails.total_paid}, due=${projectDetails.due_balance}`);
    }

    // 9. Clean up test records
    console.log('\n--- Cleaning up test records ---');
    await pool.query('DELETE FROM payments WHERE id = ?', [createdPayment.id]);
    await pool.query('DELETE FROM quotation_items WHERE quotation_id = ?', [createdQuotation.id]);
    await pool.query('DELETE FROM quotations WHERE id = ?', [createdQuotation.id]);
    await pool.query('DELETE FROM projects WHERE id = ?', [createdProject.id]);
    await pool.query('DELETE FROM leads WHERE id = ?', [createdLead.id]);
    await pool.query('DELETE FROM clients WHERE id = ?', [client.id]);
    console.log('[PASS] Test cleanup completed cleanly without residue.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Flow verification failed:', err);
    process.exit(1);
  }
}

testFullFlow();
