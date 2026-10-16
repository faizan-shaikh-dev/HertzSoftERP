import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';

// JWT Token Generator Helper
export const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// 1. Register / Create User Service
export const register = async ({ full_name, email, password, role = 'Administrator' }) => {
    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        const error = new Error('User with this email already exists');
        error.statusCode = 400;
        error.code = 'DUPLICATE_EMAIL';
        throw error;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert User
    await pool.query(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [full_name, email, hashedPassword]
    );

    // Get Created User ID
    const [userRows] = await pool.query('SELECT id, full_name, email, is_active FROM users WHERE email = ?', [email]);
    const newUser = userRows[0];

    // Assign Role
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (roleRows.length > 0) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [newUser.id, roleRows[0].id]);
        newUser.role = role;
    }

    // Generate Token
    const token = generateToken(newUser);

    return { user: newUser, token };
};

// 2. Login Service
export const login = async ({ email, password }) => {
    // Find User with role
    const [rows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, r.name as role
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.email = ?`,
        [email]
    );

    if (rows.length === 0) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }

    const user = rows[0];

    if (!user.is_active) {
        const error = new Error('Account is deactivated. Please contact admin.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_DEACTIVATED';
        throw error;
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }

    // Update Last Login Time
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Clean user object before sending
    delete user.password_hash;

    const token = generateToken(user);
    return { user, token };
};
