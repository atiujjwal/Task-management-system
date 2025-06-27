const jwt = require("jsonwebtoken");
const { config } = require("../../config");
const pool = require("../../config/db");

exports.generateAccessToken = (data) => {
    return jwt.sign(
        data,
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

exports.generateRefreshToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
};

exports.saveRefreshToken = async (data) => {
    try {
        const query = `INSERT INTO refresh_tokens SET ?`;
        const [result] = await pool.query(query, data);
        return result.insertId ? true : false;
    } catch (error) {
        console.log("Error updating refresh token: ", error);
        return false;
    }
}

exports.updateRefreshToken = async (userId, data) => {
    try {
        const query = `UPDATE refresh_tokens SET ? WHERE user_id = ?`;
        const [result] = await pool.query(query, [data, userId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.log("Error updating refresh token: ", error);
        return false;
    }
}

exports.getRefreshToken = async (userId) => {
    try {
        const query = `SELECT * FROM refresh_tokens WHERE user_id = ?`; 
        const [result] = await pool.query(query, [userId]);
        if (!result.length) return null;
        let token = result[0];
        let currentTime = new Date();
        if (token.revoked_at) return "revoked";
        return token.token;
    } catch (error) {
        console.log("Error getting refresh token: ", error);
        return null;      
    }
}

exports.invalidateRefreshToken = async (userId) => {
    try {
        const query = `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`;
        const [result] = await pool.query(query, [userId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.log("Error invalidating refresh token: ", error);
        return false;     
    }
}