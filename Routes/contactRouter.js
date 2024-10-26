const { addContact, getContacts, updateContact, deleteContact } = require('../Controllers/ContactController');
const { addContactValidation, updatemultipleContactsValidation} = require('../Middlewares/ContactValidation');
const ensureAuthenticated = require('../Middlewares/Auth')

const router = require('express').Router();

router.post('/add', ensureAuthenticated, addContactValidation, addContact);

// Retrieve contacts with optional filters
router.get('/list', ensureAuthenticated, getContacts);

// Update a contact
router.put('/update/:id', ensureAuthenticated, addContactValidation, updateContact);

// Update multiple contacts at a time

router.put('/update', ensureAuthenticated, updatemultipleContactsValidation, updateContact);

// Soft delete a contact
router.delete('/delete/:id', ensureAuthenticated, deleteContact);

module.exports = router;
