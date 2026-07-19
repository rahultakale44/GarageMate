import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@garagemate.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    console.log(`✉️  Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  
  await sendEmail({
    to: email,
    subject: 'Password Reset Request - GarageMate',
    text: `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your GarageMate account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Welcome to GarageMate!',
    text: `Welcome ${name}! Thank you for joining GarageMate.`,
    html: `
      <h2>Welcome to GarageMate!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining GarageMate - Your trusted roadside assistance platform.</p>
      <p>You can now discover nearby verified garages and request emergency assistance anytime.</p>
      <p>Safe travels!</p>
    `,
  });
};

export const sendVerificationApprovedEmail = async (email: string, garageName: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Garage Verification Approved - GarageMate',
    text: `Congratulations! Your garage "${garageName}" has been verified and approved.`,
    html: `
      <h2>Garage Verification Approved</h2>
      <p>Congratulations!</p>
      <p>Your garage "${garageName}" has been verified and approved by our team.</p>
      <p>You can now receive service requests from customers.</p>
      <p>Login to your dashboard to get started.</p>
    `,
  });
};

export const sendVerificationRejectedEmail = async (email: string, garageName: string, reason: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Garage Verification Status - GarageMate',
    text: `Your garage "${garageName}" verification could not be completed. Reason: ${reason}`,
    html: `
      <h2>Garage Verification Update</h2>
      <p>We regret to inform you that your garage "${garageName}" verification could not be completed at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please update your information and resubmit for verification.</p>
    `,
  });
};
