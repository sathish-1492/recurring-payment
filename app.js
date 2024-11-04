require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./models/db');
const webhookRoutes = require('./routes/webhook');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const checkPhoneVerificationRoute = require('./routes/checkPhoneVerification'); // Adjust path as necessary
const configurationController = require('./controllers/configurationController');

const app = express();


// Setup access logs
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Use morgan for logging
app.use(morgan('combined', { stream: accessLogStream }));  // Logs all requests to access.log

// Set up body-parser for JSON requests only
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname)));

// Use the phone verification check route
app.use('/api/phone-verification', checkPhoneVerificationRoute);


app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'admin.html'));
});

app.get('/:phone', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'dashboard.html'));
});



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/message', messageRoutes);


async function startServer() {

    // Connect to DB
    connectDB();
    await configurationController.createConfiguration(); // Update the database with config.json

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    console.log('App initiated')

}


startServer();

