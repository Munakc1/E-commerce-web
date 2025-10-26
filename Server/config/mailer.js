const nodemailer = require('nodemailer');
require('dotenv').config();

// Build a transporter from environment or fallback to jsonTransport for dev
function buildTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  // Fallback: log emails to console as JSON (does not actually send)
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = buildTransporter();

async function sendMail({ to, subject, text, html, from }) {
  const { SMTP_FROM } = process.env;
  const mailFrom = from || SMTP_FROM || 'no-reply@thriftsy.local';
  const info = await transporter.sendMail({ from: mailFrom, to, subject, text, html });
  // If using jsonTransport, info.message will contain the JSON representation
  return info;
}

module.exports = { sendMail };
