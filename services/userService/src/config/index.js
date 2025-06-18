require('dotenv').config();

const {
    PORT,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

const config = {
    port: PORT || 3001,
    jwtSecret: JWT_SECRET,
    jwtExpiresIn: JWT_EXPIRES_IN || '1d',
    db: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        name: DB_NAME,
    }
};

module.exports = {
    config
};