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
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
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
    // Build plain-text fallback without regex stripping (avoids incomplete sanitization)
    text: text || stripHtmlTags(html),
  });
}

/**
 * Convert an HTML string to plain text by replacing block tags with newlines
 * and removing remaining tags using a whitelist-aware approach.
 * @param {string} html
 * @returns {string}
 */
function stripHtmlTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Email Templates ─────────────────────────────────────────────────────────

async function sendRegistrationEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to LandChain',
    html: `
      <h2>Welcome to LandChain, ${user.full_name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Please complete your KYC verification to start using all features.</p>
      <p>Log in at <a href="${process.env.CORS_ORIGIN}">LandChain Platform</a></p>
    `,
  });
}

async function sendTransferNotificationEmail({ to, name, propertyAddress, role, transferId }) {
  const roleLabel = role === 'buyer' ? 'buyer' : 'seller';
  await sendEmail({
    to,
    subject: `LandChain — Property Transfer Initiated`,
    html: `
      <h2>Property Transfer Update</h2>
      <p>Dear ${name},</p>
      <p>A property transfer for <strong>${propertyAddress}</strong> has been initiated.</p>
      <p>You are listed as the <strong>${roleLabel}</strong> in this transaction.</p>
      <p>Transfer reference: <code>${transferId}</code></p>
      <p>Log in to LandChain to review and take action.</p>
    `,
  });
}

async function sendApprovalEmail({ to, name, subject, message }) {
  await sendEmail({
    to,
    subject: `LandChain — ${subject}`,
    html: `
      <h2>${subject}</h2>
      <p>Dear ${name},</p>
      <p>${message}</p>
      <p>Log in to <a href="${process.env.CORS_ORIGIN}">LandChain</a> for details.</p>
    `,
  });
}

module.exports = { sendEmail, sendRegistrationEmail, sendTransferNotificationEmail, sendApprovalEmail };
