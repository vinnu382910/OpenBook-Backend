
const UserModel = async () => {
    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            );
        `);
        console.log("Users table created successfully");
    } catch (error) {
        console.error("Error creating users table:", error);
    }
};

// Call the function to create the table

module.exports = UserModel;
