const mysql = require('mysql2/promise');

// Setup the SQL connection pool (update with your database config)
let connection;

const connectToDatabase = async () => {
    try {
        if (!connection) {
            connection = await mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            });
            console.log(process.env.DB_NAME+' Database connected successfully');
        }
        return connection;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err; // Rethrow the error to handle it later
    }
};

module.exports = connectToDatabase;
