// routes/contactRoutes.js
const multer = require('multer');
const {bulkUploadContacts}  = require('../Controllers/BulkUploadContacts');
const ensureAuthenticated = require('../Middlewares/Auth')
const {downloadContacts} = require('../Controllers/DownloadContacts')

const router = require('express').Router();

// Multer setup for handling file uploads in memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Allow only CSV and Excel files
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only CSV and Excel files are allowed!'), false);
        }
    }
});

// Define the route to upload contacts
router.post('/upload', ensureAuthenticated, upload.single('contactsFile'), bulkUploadContacts);

router.get('/download', ensureAuthenticated, downloadContacts);

module.exports = router;
