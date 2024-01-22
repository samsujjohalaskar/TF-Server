const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors');

dotenv.config({path: './config.env'})
require('./database/connection');


const app = express();
// Enable All CORS Requests
app.use(cors({
    // origin: 'https://tasteandflavor.vercel.app',
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
    credentials: true,
    exposedHeaders: ['set-cookie'], // Expose the 'set-cookie' header to the frontend
}));

app.use(cookieParser())

app.use(express.json());

app.use(require('./routes/router'));

// const middleware = (req,res,next) => {
//     console.log('Middleware.');
//     next();
// }

const PORT = process.env.PORT || 6010;

// const User = require('./models/userModel');

app.listen(PORT,function(){
    console.log(`Server is Running on Port ${PORT}...`);
});