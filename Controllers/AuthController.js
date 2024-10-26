const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const connectToDatabase = require('../Models/db')

const ramdomstring = require('randomstring'); //randomstring for creating tokens
const sendMail = require('../Middlewares/sendMail');

// Register function
const register = async (req, res) => {
    console.log("Running Controller");
    try {
        const db = await connectToDatabase();  // Ensure DB is connected
        const { name, email, password } = req.body;

        // Check if user already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'User already exists, you can login', success: false });
        }

        // Hash the password and insert the new user into the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        await db.query('INSERT INTO users (name, email, password, id) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, id]);

        
        //Email verfication is done here 
        let mailSubject = 'Mail Verification';
        const randomToken = ramdomstring.generate();
        const content = `
                            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                                <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                                <h2 style="color: #333;">Hello, ${req.body.name}!</h2>
                                <p style="font-size: 16px; color: #555;">
                                    Thank you for registering with us. Please click the button below to verify your email address:
                                </p>
                                <a href="http://localhost:9090/mail-verification?token=${randomToken}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; margin-top: 10px;">
                                    Verify Your Email
                                </a>
                                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                                    If you did not create an account, please ignore this email.
                                </p>
                                </div>
                            </div>
                            `;
        sendMail(req.body.email, mailSubject, content);

        db.query('Update users set token=? where email=?', [randomToken, req.body.email], function(error, result, fields){ //Add random string as token
            if(error){
                return res.status(400).send({
                    msg:err
                })
            }
        });


        res.status(201).json({ message: 'Signup successfully', success: true });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

// Login function
const login = async (req, res) => {
    try {
        const db = await connectToDatabase(); // Ensure DB is connected
        const { email, password } = req.body;
        const errMsg = 'Authentication failed: email or password is wrong';

        // Find the user by email
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(403).json({ message: 'No user found, please provide valid details', success: false });
        }

        // Compare the provided password with the hashed password
        const isPasswordEqual = await bcrypt.compare(password, user[0].password);
        if (!isPasswordEqual) {
            return res.status(403).json({ message: errMsg, success: false });
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT secret is not set', success: false });
        }

        const jwtToken = jwt.sign(
            { email: user[0].email, id: user[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            email,
            name: user[0].name
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

const verifyToken = async (req, res) => {
    const token = req.query.token; // Get the token from query parameters

    try {
        const db = await connectToDatabase();
        const [result] = await db.query('SELECT * FROM users WHERE token= ? LIMIT 1', [token]);

        if (result.length > 0) {
            await db.query('UPDATE users SET token = null, is_verified = 1 WHERE id = ?', [result[0].id]);
            console.log('Token is verified');
            return res.render('mail-verification', { message: 'Mail verified successfully!' });
        } else {
            return res.status(404).render('mail-verification', { message: 'Invalid token or user not found' });
        }
    } catch (error) {
        console.error('Error during token verification:', error);
        return res.status(500).render('mail-verification', { message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    verifyToken,
};
