import pool from '../config/db.js';

/**
 * Record an audit log entry for actions across the CRM/ERP system
 */
export const logAudit = async ({ actor_user_id, action, entity_type, entity_id, summary, metadata = {} }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, summary, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actor_user_id || null, action, entity_type, entity_id, summary, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

/**
 * Fetch timeline audit history for an entity
 */
export const getAuditLogs = async (entity_type, entity_id) => {
  try {
    const [rows] = await pool.query(
      `SELECT al.*, u.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_user_id = u.id
       WHERE al.entity_type = ? AND al.entity_id = ?
       ORDER BY al.created_at DESC`,
      [entity_type, entity_id]
    );
    return rows;
  } catch (err) {
    console.error('Fetch audit logs failed:', err.message);
    return [];
  }
};

