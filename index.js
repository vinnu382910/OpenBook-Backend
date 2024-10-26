const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const webRouter = require('./Routes/webRouter')
const contactRouter = require('./Routes/contactRouter')
const uploadBulkContacts = require('./Routes/bulkContactRouter')

require('dotenv').config();
require('./Models/db')
const PORT = process.env.PORT || 9090 //Fetch Port from .env file else take 8080 port default

app.get('/ping', (req, res) => {
    res.send('pong')
})

app.use(bodyParser.json())
app.use(cors())
app.use('/auth', AuthRouter)
app.use('/', webRouter)
app.use('/', contactRouter)
app.use('/bulkcontacts/', uploadBulkContacts)



app.listen(PORT, () => {
    console.log('Server is Running')
})