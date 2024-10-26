const express = require('express');
const { verifyToken } = require('../Controllers/AuthController');


const user_route = express();

user_route.set('view engine', 'ejs');
user_route.set('views', './views')
user_route.use(express.static('public'));

user_route.get('/mail-verification', verifyToken)

module.exports = user_route;