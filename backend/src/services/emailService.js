'use strict';

/**
 * Email service.
 * Uses nodemailer when SMTP_HOST is configured; falls back to console logging in development.
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Email] Nodemailer transporter configured');
  }
  return transporter;
}

/**
 * Send an email.
 * Each caller MUST supply both `html` and `text` to avoid any regex-based sanitization.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html  - HTML body (used by SMTP transporter)
 * @param {string} options.text  - Plain-text body (required; must be provided explicitly)
 */
async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] [DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@landchain.io',
    to,
    subject,
    html,
    text,
  });
}

// ─── Email Templates ─────────────────────────────────────────────────────────

async function sendRegistrationEmail(user) {
  const appUrl = process.env.CORS_ORIGIN || 'https://landchain.io';
  await sendEmail({
    to: user.email,
    subject: 'Welcome to LandChain',
    html: `<h2>Welcome to LandChain, ${user.full_name}!</h2>
<p>Your account has been created successfully.</p>
<p>Please complete your KYC verification to start using all features.</p>
<p>Log in at <a href="${appUrl}">LandChain Platform</a></p>`,
    text: `Welcome to LandChain, ${user.full_name}!\n\nYour account has been created successfully.\nPlease complete your KYC verification to start using all features.\nLog in at ${appUrl}`,
  });
}

async function sendTransferNotificationEmail({ to, name, propertyAddress, role, transferId }) {
  const roleLabel = role === 'buyer' ? 'buyer' : 'seller';
  await sendEmail({
    to,
    subject: 'LandChain — Property Transfer Initiated',
    html: `<h2>Property Transfer Update</h2>
<p>Dear ${name},</p>
<p>A property transfer for <strong>${propertyAddress}</strong> has been initiated.</p>
<p>You are listed as the <strong>${roleLabel}</strong> in this transaction.</p>
<p>Transfer reference: <code>${transferId}</code></p>
<p>Log in to LandChain to review and take action.</p>`,
    text: `Property Transfer Update\n\nDear ${name},\n\nA property transfer for "${propertyAddress}" has been initiated.\nYou are listed as the ${roleLabel} in this transaction.\nTransfer reference: ${transferId}\n\nLog in to LandChain to review and take action.`,
  });
}

async function sendApprovalEmail({ to, name, subject, message }) {
  await sendEmail({
    to,
    subject: `LandChain — ${subject}`,
    html: `<h2>${subject}</h2>
<p>Dear ${name},</p>
<p>${message}</p>
<p>Log in to LandChain for details.</p>`,
    text: `${subject}\n\nDear ${name},\n\n${message}\n\nLog in to LandChain for details.`,
  });
}

module.exports = { sendEmail, sendRegistrationEmail, sendTransferNotificationEmail, sendApprovalEmail };
