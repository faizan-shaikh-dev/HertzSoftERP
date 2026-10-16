import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hertzsoft_crm',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database (phpMyAdmin)!');
    connection.release();
} catch (error) {
    console.error('MySQL Connection Failed:', error.message);
}

export default pool;
