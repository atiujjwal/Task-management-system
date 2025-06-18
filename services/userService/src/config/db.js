const mysql = require("mysql2/promise"); 
const config = require("./index").config; 


const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool
  .getConnection()
  .then((connection) => {
    console.log("UserService: MySQL connected successfully.");
    connection.release();
  })
  .catch((err) => {
    console.log("UserService: Failed to connect to MySQL:", err.message);
    process.exit(1);
  });

module.exports = pool;
