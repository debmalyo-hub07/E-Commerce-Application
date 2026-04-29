import nodemailer from 'nodemailer';

// Auto-detect and fix Brevo host mismatch if user left it as gmail
let host = process.env.SMTP_HOST || 'smtp.gmail.com';
if (process.env.SMTP_USER?.includes('brevo.com') || process.env.SMTP_PASSWORD?.startsWith('xsmtpsib')) {
  host = 'smtp-relay.brevo.com';
}

const transporter = nodemailer.createTransport({
  host: host,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your NexMart Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Welcome to NexMart!</h2>
        <p style="font-size: 16px; color: #555;">Please use the following OTP to verify your email address:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f4; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("SMTP_USER or SMTP_PASSWORD not set. Falling back to console logging OTP.");
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return true;
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
