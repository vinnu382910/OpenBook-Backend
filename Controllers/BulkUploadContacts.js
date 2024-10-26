const csv = require('csv-parser');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const connectToDatabase = require('../Models/db'); // Assuming this is your DB connection logic
const { Readable } = require('stream');

// Function to parse CSV file and create/update contacts
const parseCSVFile = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const contacts = [];
        const stream = Readable.from(fileBuffer.toString()); // Convert buffer to readable stream

        stream.pipe(csv())
            .on('data', (row) => {
                contacts.push(row); // Add data to contacts array
            })
            .on('end', () => {
                resolve(contacts);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

// Function to parse Excel file and create/update contacts
const parseExcelFile = async (fileBuffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet); // Return contacts array
};

// Bulk contact upload handler
const bulkUploadContacts = async (req, res) => {
    let contacts = [];
    let db;

    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileBuffer = req.file.buffer;

        // Parse file based on file type
        if (req.file.mimetype === 'text/csv') {
            contacts = await parseCSVFile(fileBuffer);
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            contacts = await parseExcelFile(fileBuffer);
        } else {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // Establish database connection
        db = await connectToDatabase();

        // Validate and save contacts to the database
        console.log("Parsed Contacts:", contacts);
        for (const contact of contacts) {
            const { name, email, phone, address, timezone, id } = contact;

            // Add validation for required fields here
            if (!name || !email) {
                console.warn('Skipping invalid contact:', contact);
                continue; // Skip invalid contact
            }

            // Prepare SQL query and parameters
            const query = id
                ? `UPDATE contacts SET name = ?, email = ?, phone = ?, address = ?, timezone = ? WHERE id = ? AND user_id = ?`
                : `INSERT INTO contacts (id, user_id, name, email, phone, address, timezone) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const params = id
                ? [name, email, phone, address, timezone, id, req.user.id]
                : [uuidv4(), req.user.id, name, email, phone, address, timezone];

            console.log("Executing query:", query);
            console.log("With parameters:", params);

            try {
                const result = await db.query(query, params);
                console.log("Query result:", result);
            } catch (err) {
                console.error("Database error:", err);
                // Optionally handle the error to inform the user about the specific failure
                return res.status(500).json({ message: 'Database error occurred while processing contacts', error: err.message });
            }
        }

        res.status(200).json({ message: 'Contacts uploaded successfully' });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Failed to process file', error: error.message });
    }
};

module.exports = {
    bulkUploadContacts
};
