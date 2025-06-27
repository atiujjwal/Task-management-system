const pool = require("../config/db");
const bcrypt = require("bcryptjs");

/**
 * Creates a new user
 * @param {object} data 
 * @returns insertId/null
 */

exports.createUser = async (data) => {
  try {
    data.password = await bcrypt.hash(data.password, 10);
    let query = `INSERT INTO task_manager_users.users SET ?`;
    const [result] = await pool.query(query, data);
    return result.affectedRows ? result.insertId : null;
  } catch (error) {
    console.log("Error creating user: ", error);
    return null;
  }
};

/**
 * Updates a user
 * @param {object} data - data being updated
 * @returns true/false
 */

exports.updateUser = async ({id, data}) => {
  try {
    let query = `UPDATE task_manager_users.users SET ? WHERE id = ?`;
    const [result] = await pool.query(query, [data, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.log("Error updating user: ", error);
    return false;
  }
};


/**
 * Gets user details
 * @param {integer} id
 * @param {string} email
 * @param {string} mobile
 * @returns object/null
 */

exports.getUserDetails = async ({ id, email, mobile }) => {
  try {
    const [key, value] =
      Object.entries({ id, email, mobile }).find(([_, v]) => v !== undefined) ||
      [];
    const query = `SELECT * FROM users WHERE status = 1 AND ${key} = ?`;
    const [result] = await pool.query(query, [value]);
    return result.length ? result[0] : null;
  } catch (error) {
    console.log("Error getting user: ", error);
    return null;
  }
};
