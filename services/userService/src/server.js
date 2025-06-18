const app = require('./app');
const { config } = require('./config');
const pool = require('./config/db');

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            console.log(`User Service running on port ${config.port}`);
        });
    } catch (error) {
        console.error('User Service: Error starting server:', error);
        process.exit(1);
    }
};

startServer();