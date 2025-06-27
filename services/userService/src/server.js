const app = require('./app');
const { config } = require('./config');

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            console.log(`UserService running on port ${config.port}`);
        });
    } catch (error) {
        console.error("UserService: Error starting server: ", error);
        process.exit(1);
    }
};

startServer();