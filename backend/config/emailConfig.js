// backend/config/emailConfig.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // ya koi aur service jaise outlook, yahoo
    auth: {
        user: 'eventopportunity.team@gmail.com', // Apna email
        pass: 'jolc sqjf xufj umsf'      // Gmail app password (not regular password)
    }
});

module.exports = transporter;