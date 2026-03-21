const nodemailer = require('nodemailer');

let transporterPromise;

const hasSmtpConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );

const getTransporter = async () => {
  if (!hasSmtpConfig()) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      })
    );
  }

  return transporterPromise;
};

const getFromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER;

const sendEmailVerification = async ({ email, firstName, verificationUrl }) => {
  const transporter = await getTransporter();

  if (!transporter) {
    console.log(`Email verification link for ${email}: ${verificationUrl}`);
    return { delivered: false, mode: 'log' };
  }

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Verify your ANT PRESS account',
    text: `Hello ${firstName || 'there'}, verify your ANT PRESS account by opening this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Verify your ANT PRESS account</h2>
        <p>Hello ${firstName || 'there'},</p>
        <p>Thanks for creating an account. Click the button below to verify your email address and activate your sign-in.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: #f59e0b; color: #0f172a; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 999px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
    `,
  });

  return { delivered: true, mode: 'smtp' };
};

module.exports = {
  hasSmtpConfig,
  sendEmailVerification,
};
