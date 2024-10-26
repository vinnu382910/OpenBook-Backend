const { v4: uuidv4 } = require('uuid'); // Importing UUID for unique ID generation
const connectToDatabase = require('../Models/db'); // Import database connection

// Add a new contact
const addContact = async (req, res) => {
    let contacts = req.body; // Get the request body

    // Check if the request body is a single object, and convert it to an array
    if (!Array.isArray(contacts)) {
        contacts = [contacts];
    }

    try {
        const db = await connectToDatabase(); // Establish database connection

        // Create an array of promises for inserting contacts
        const insertPromises = contacts.map(async (contact) => {
            const { name, email, phone, address, timezone } = contact;

            // Check if the contact already exists
            const checkQuery = `SELECT * FROM contacts WHERE user_id = ? AND (email = ? OR phone = ?)`;
            const [existingContact] = await db.query(checkQuery, [req.user.id, email, phone]);

            if (existingContact.length > 0) {
                throw new Error(`Contact with email ${email} or phone ${phone} already exists`);
            }

            // Prepare the SQL query to insert a new contact
            const query = `INSERT INTO contacts (id, user_id, name, email, phone, address, timezone) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            // Generate a unique ID for the new contact
            const contactId = uuidv4();

            await db.query(query, [contactId, req.user.id, name, email, phone, address, timezone]); // Execute the query
        });

        // This line waits for all insert operations to complete
        await Promise.all(insertPromises); // Proceed only after all contacts have been inserted

        res.status(201).json({ message: 'Contacts added successfully' }); // Respond with success
    } catch (err) {
        console.error(err); // Log error for debugging
        res.status(409).json({ error: err.message }); // Respond with error (409 for conflict)
    }
};



// Retrieve contacts with optional filters
const getContacts = async (req, res) => {
    const { name, email, timezone, sortField = 'created_at', sortOrder = 'ASC' } = req.query;

    try {
        const db = await connectToDatabase(); // Establish database connection

        // Prepare the base SQL query to retrieve contacts
        let query = `SELECT * FROM contacts WHERE user_id = ? AND is_active = TRUE`;
        const params = [req.user.id]; // Initialize parameters with user ID

        console.log('getting list of contacts')

        // Apply filters based on query parameters
        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        if (email) {
            query += ' AND email LIKE ?';
            params.push(`%${email}%`);
        }
        if (timezone) {
            query += ' AND timezone = ?';
            params.push(timezone);
        }

        // Append sorting options
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        const [contacts] = await db.query(query, params); // Execute the query

        res.status(200).json(contacts); // Respond with the retrieved contacts
    } catch (err) {
        console.error(err); // Log error for debugging
        res.status(500).json({ error: 'Failed to retrieve contacts' }); // Respond with error
    }
};

// Update a contact
const updateContact = async (req, res) => {
    // Extract user ID from request
    const userId = req.user.id;

    try {
        const db = await connectToDatabase(); // Establish database connection

        // Check if the body is an array (for multiple contacts)
        if (Array.isArray(req.body)) {
            // Prepare an array to hold the results
            const updatePromises = req.body.map(async (contact) => {
                const { name, email, phone, address, timezone, id } = contact; // Destructure contact properties
                const query = `UPDATE contacts SET name = ?, email = ?, phone = ?, address = ?, timezone = ? WHERE id = ? AND user_id = ?`;

                return await db.query(query, [name, email, phone, address, timezone, id, userId]); // Execute the query
            });

            // Await all update promises
            await Promise.all(updatePromises);

            return res.status(200).json({ message: 'Contacts updated successfully' }); // Respond with success
        } else {
            // Handle single contact update
            const { name, email, phone, address, timezone } = req.body; // Extract contact properties
            const { id } = req.params; // Extract contact ID from request parameters

            // Prepare the SQL query to update the contact
            const query = `UPDATE contacts SET name = ?, email = ?, phone = ?, address = ?, timezone = ? WHERE id = ? AND user_id = ?`;

            await db.query(query, [name, email, phone, address, timezone, id, userId]); // Execute the query

            return res.status(200).json({ message: 'Contact updated successfully' }); // Respond with success
        }
    } catch (err) {
        console.error(err); // Log error for debugging
        res.status(500).json({ error: 'Failed to update contact' }); // Respond with error
    }
};

// Soft delete a contact
const deleteContact = async (req, res) => {
    const { id } = req.params; // Extract contact ID from request parameters

    try {
        const db = await connectToDatabase(); // Establish database connection

        // Prepare the SQL query to soft delete the contact
        const query = `UPDATE contacts SET is_active = FALSE WHERE id = ? AND user_id = ?`;
        
        await db.query(query, [id, req.user.id]); // Execute the query

        res.status(200).json({ message: 'Contact deleted (soft delete)' }); // Respond with success
    } catch (err) {
        console.error(err); // Log error for debugging
        res.status(500).json({ error: 'Failed to delete contact' }); // Respond with error
    }
};

// Export all functions
module.exports = {
    addContact,
    getContacts,
    updateContact,
    deleteContact
};
