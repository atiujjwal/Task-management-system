const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');


async function findUserByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    const user = rows[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    return user;
}


async function findUserById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const user = rows[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    return user;
}

async function createUser({ username, email, password, roles }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date();
    const rolesString = Array.isArray(roles) ? roles.join(',') : 'team_member'; // Convert roles array to string

    const [result] = await pool.execute(
        'INSERT INTO users (id, username, email, password, roles, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, username, email, hashedPassword, rolesString, now, now]
    );

    if (result.affectedRows === 0) {
        throw new Error('Failed to create user');
    }

    return {
        id: userId,
        username,
        email,
        roles: rolesString.split(',') 
    };
}


async function comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    comparePassword
};