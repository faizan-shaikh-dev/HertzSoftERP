import pool from './db.js';

async function migrate() {
  console.log('🚀 Starting Finance Schema Migration...');
  const conn = await pool.getConnection();

  try {
    // 1. Check & Add columns to quotations table
    const [qCols] = await conn.query('DESCRIBE quotations');
    const existingQCols = qCols.map(c => c.Field);

    const qAdditions = [
      { name: 'timeline', sql: 'ADD COLUMN timeline VARCHAR(100) NULL AFTER valid_until' },
      { name: 'project_type', sql: 'ADD COLUMN project_type VARCHAR(100) NULL AFTER timeline' },
      { name: 'scope_modules', sql: 'ADD COLUMN scope_modules JSON NULL AFTER notes' },
      { name: 'third_party_costs', sql: 'ADD COLUMN third_party_costs JSON NULL AFTER scope_modules' },
      { name: 'payment_milestones', sql: 'ADD COLUMN payment_milestones JSON NULL AFTER third_party_costs' },
      { name: 'invoice_number', sql: 'ADD COLUMN invoice_number VARCHAR(50) NULL AFTER payment_milestones' }
    ];

    for (const col of qAdditions) {
      if (!existingQCols.includes(col.name)) {
        console.log(`Adding column "${col.name}" to quotations...`);
        await conn.query(`ALTER TABLE quotations ${col.sql}`);
      } else {
        console.log(`Column "${col.name}" already exists in quotations.`);
      }
    }

    // 2. Check & Add columns to payments table
    const [pCols] = await conn.query('DESCRIBE payments');
    const existingPCols = pCols.map(c => c.Field);

    const pAdditions = [
      { name: 'receipt_number', sql: 'ADD COLUMN receipt_number VARCHAR(50) NULL AFTER id' },
      { name: 'invoice_number', sql: 'ADD COLUMN invoice_number VARCHAR(50) NULL AFTER receipt_number' },
      { name: 'payment_status', sql: "ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'Part Payment' AFTER amount_paid" },
      { name: 'invoice_amount', sql: 'ADD COLUMN invoice_amount DECIMAL(12,2) NULL AFTER amount_paid' }
    ];

    for (const col of pAdditions) {
      if (!existingPCols.includes(col.name)) {
        console.log(`Adding column "${col.name}" to payments...`);
        await conn.query(`ALTER TABLE payments ${col.sql}`);
      } else {
        console.log(`Column "${col.name}" already exists in payments.`);
      }
    }

    console.log('✅ Finance Schema Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();

