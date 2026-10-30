import pool from '../config/db.js';

// Get Consolidated ERP Dashboard Metrics
export const getDashboardMetrics = async () => {
  // 1. Leads Metrics (Business Client Pipeline)
  const [leadsStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_leads,
      SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) AS won_leads,
      SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) AS lost_leads,
      SUM(CASE WHEN status NOT IN ('Won', 'Lost') THEN 1 ELSE 0 END) AS active_pipeline_leads
    FROM leads
  `);

  // 2. Projects Metrics
  const [projectStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_projects,
      SUM(CASE WHEN status IN ('Planning', 'In Progress') THEN 1 ELSE 0 END) AS active_projects,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_projects,
      COALESCE(SUM(total_cost), 0) AS total_deal_value
    FROM projects
  `);

  // 3. Payment Metrics
  const [paymentStats] = await pool.query(`
    SELECT 
      COALESCE(SUM(amount_paid), 0) AS total_collected
    FROM payments
  `);

  // 4. Certificates & Documents Metrics
  const [certStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_certificates_issued
    FROM certificates
  `);

  // 5. Recent 10 Leads
  const [recentLeads] = await pool.query(`
    SELECT id, lead_number, name, company_name, phone, email, service_interest, estimated_budget, status, created_at 
    FROM leads 
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  // 6. Recent 10 Payments
  const [recentPayments] = await pool.query(`
    SELECT 
      pm.id, 
      pm.amount_paid, 
      pm.payment_method, 
      pm.payment_date, 
      pm.transaction_reference,
      p.title AS project_title,
      c.name AS client_name,
      c.company_name AS client_company
    FROM payments pm
    JOIN projects p ON pm.project_id = p.id
    JOIN clients c ON pm.client_id = c.id
    ORDER BY pm.created_at DESC 
    LIMIT 10
  `);

  const totalDealValue = Number(projectStats[0]?.total_deal_value || 0);
  const totalCollected = Number(paymentStats[0]?.total_collected || 0);
  const totalPendingDue = Math.max(0, totalDealValue - totalCollected);

  return {
    leads: {
      total: Number(leadsStats[0]?.total_leads || 0),
      won: Number(leadsStats[0]?.won_leads || 0),
      lost: Number(leadsStats[0]?.lost_leads || 0),
      active_pipeline: Number(leadsStats[0]?.active_pipeline_leads || 0)
    },
    projects: {
      total: Number(projectStats[0]?.total_projects || 0),
      active: Number(projectStats[0]?.active_projects || 0),
      completed: Number(projectStats[0]?.completed_projects || 0)
    },
    financials: {
      total_deal_value: totalDealValue,
      total_collected: totalCollected,
      total_pending_due: totalPendingDue
    },
    documents: {
      total_certificates_issued: Number(certStats[0]?.total_certificates_issued || 0)
    },
    recent_activity: {
      recent_leads: recentLeads,
      recent_payments: recentPayments
    }
  };
};
