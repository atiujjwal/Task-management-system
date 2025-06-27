const mysql = require("mysql2/promise");
const config = require("./index").config;

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});


(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("UserService: MySQL connected successfully.");
    connection.release(); 
  } catch (error) {
    console.error("Failed to connect to MySQL DB:", error.message);
    process.exit(1); 
  }
})();

module.exports = pool;
