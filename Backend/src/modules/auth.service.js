import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Auto-initialize refresh_tokens table in MySQL
export const initRefreshTokenTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id CHAR(36) NOT NULL,
                token VARCHAR(500) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_token (token(255))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (err) {
        console.error('Failed to ensure refresh_tokens table:', err.message);
    }
};

// Run table setup on module load
initRefreshTokenTable().catch(() => {});

// Access Token Generator (Short-lived: 15m)
export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
};

// Refresh Token Generator (Long-lived: 7d)
export const generateRefreshToken = (user) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh');
    return jwt.sign(
        { id: user.id },
        refreshSecret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

// Backward-compatible alias
export const generateToken = generateAccessToken;

// Store refresh token helper
const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await initRefreshTokenTable();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, refreshToken, expiresAt]
        );
    } catch (err) {
        console.error('Failed to store refresh token in database:', err.message);
    }
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

    // Generate Tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    await storeRefreshToken(newUser.id, refreshToken);

    return { 
        user: newUser, 
        token: accessToken, 
        accessToken, 
        refreshToken 
    };
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);

    return { 
        user, 
        token: accessToken, 
        accessToken, 
        refreshToken 
    };
};

// 3. Refresh Access Token Service (with Token Rotation)
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error('Refresh token is required');
        error.statusCode = 400;
        error.code = 'REFRESH_TOKEN_REQUIRED';
        throw error;
    }

    await initRefreshTokenTable();
    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh');
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
        // Expired or invalid signature -> purge matching token from DB
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]).catch(() => {});
        const error = new Error('Invalid or expired refresh token. Please login again.');
        error.statusCode = 401;
        error.code = 'INVALID_REFRESH_TOKEN';
        throw error;
    }

    // Check token existence in DB and expiry
    const [tokenRows] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
        [refreshToken, decoded.id]
    );

    if (tokenRows.length === 0) {
        const error = new Error('Refresh token is invalid, revoked, or expired. Please login again.');
        error.statusCode = 401;
        error.code = 'REVOKED_REFRESH_TOKEN';
        throw error;
    }

    // Check user active status
    const [userRows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.is_active, r.name as role
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ?`,
        [decoded.id]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [decoded.id]).catch(() => {});
        const error = new Error('User account is deactivated or no longer exists.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_DEACTIVATED';
        throw error;
    }

    const user = userRows[0];

    // Token Rotation: Generate new access token and new rotated refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Delete used refresh token & insert new rotated refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, newRefreshToken, newExpiresAt]
    );

    return {
        user,
        token: newAccessToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

// 4. Revoke Refresh Token on Logout
export const revokeRefreshToken = async (refreshToken) => {
    if (refreshToken) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]).catch(() => {});
    }
    return { success: true };
};

// 5. Update User Profile & Account Settings
export const updateProfile = async (userId, { full_name, email, current_password, new_password }) => {
    // 1. Fetch current user
    const [rows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, r.name as role
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ?`,
        [userId]
    );

    if (rows.length === 0) {
        const error = new Error('User account not found');
        error.statusCode = 404;
        throw error;
    }

    const user = rows[0];

    // 2. Validate email uniqueness if changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length > 0) {
            const error = new Error('This email address is already taken by another account');
            error.statusCode = 409;
            error.code = 'DUPLICATE_EMAIL';
            throw error;
        }
    }

    // 3. Password change handling
    let newPasswordHash = null;
    if (new_password) {
        if (!current_password) {
            const error = new Error('Current password is required to set a new password');
            error.statusCode = 400;
            error.code = 'CURRENT_PASSWORD_REQUIRED';
            throw error;
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            const error = new Error('Current password does not match');
            error.statusCode = 400;
            error.code = 'INVALID_CURRENT_PASSWORD';
            throw error;
        }

        if (new_password.length < 6) {
            const error = new Error('New password must be at least 6 characters long');
            error.statusCode = 400;
            throw error;
        }

        newPasswordHash = await bcrypt.hash(new_password, 10);
    }

    const updatedFullName = full_name?.trim() || user.full_name;
    const updatedEmail = email?.trim()?.toLowerCase() || user.email;

    if (newPasswordHash) {
        await pool.query(
            'UPDATE users SET full_name = ?, email = ?, password_hash = ? WHERE id = ?',
            [updatedFullName, updatedEmail, newPasswordHash, userId]
        );
    } else {
        await pool.query(
            'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
            [updatedFullName, updatedEmail, userId]
        );
    }

    const updatedUser = {
        id: user.id,
        full_name: updatedFullName,
        email: updatedEmail,
        role: user.role,
        is_active: user.is_active
    };

    const token = generateAccessToken(updatedUser);
    return { user: updatedUser, token, accessToken: token };
};
