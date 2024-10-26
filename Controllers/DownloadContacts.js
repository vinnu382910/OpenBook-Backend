// controllers/contactController.js
const connectToDatabase = require('../Models/db'); // Assuming this is your DB connection logic
const xlsx = require('xlsx');

// Function to download contacts as CSV or Excel
const downloadContacts = async (req, res) => {
    try {
        const db = await connectToDatabase(); // Establish database connection

        // Retrieve all contacts for the user
        const query = `SELECT id, name, email, phone, address, timezone, created_at FROM contacts WHERE user_id = ?`;
        const [contacts] = await db.query(query, [req.user.id]);

        if (!contacts.length) {
            return res.status(404).json({ message: 'No contacts found' });
        }

        // Check file format requested
        const format = req.query.format || 'csv'; // Default to CSV

        if (format === 'csv') {
            // Generate CSV file
            const csvData = contacts.map(contact => ({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                address: contact.address,
                timezone: contact.timezone,
                created_at: contact.created_at
            }));

            // Convert JSON to CSV string
            const csvString = [Object.keys(csvData[0])].concat(csvData.map(item => Object.values(item))).map(e => e.join(",")).join("\n");

            // Send CSV file as response
            res.header('Content-Type', 'text/csv');
            res.attachment('contacts.csv');
            res.send(csvString);
        } else if (format === 'excel') {
            // Generate Excel file
            const worksheet = xlsx.utils.json_to_sheet(contacts);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
            const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Send Excel file as response
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment('contacts.xlsx');
            res.send(excelBuffer);
        } else {
            res.status(400).json({ message: 'Invalid format' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to download contacts' });
    }
};

module.exports = {
    downloadContacts
};
