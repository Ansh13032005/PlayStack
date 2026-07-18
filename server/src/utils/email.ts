import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

// Core transport builder
async function getTransporter() {
  if (ENV.EMAIL_USER && ENV.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: ENV.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(ENV.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });
  } else if (ENV.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@example.com',
        pass: 'your-password',
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

export async function sendWelcomeEmail(to: string, name: string, employeeId: string) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Enterprise EMS" <noreply@enterprise-ems.com>',
      to: to,
      subject: 'Welcome to Enterprise EMS!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">Welcome to the Team, ${name}!</h2>
          <p>We are thrilled to have you onboard.</p>
          <p>Your official Employee ID is: <strong>${employeeId}</strong></p>
          <p>Please log in to the portal using your employee ID to update your profile.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The HR Team</strong></p>
        </div>
      `,
    });

    if (ENV.NODE_ENV !== 'production') {
      console.log('Preview URL for Welcome Email: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendOTPPasswordResetEmail(to: string, otp: string) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Enterprise EMS" <noreply@enterprise-ems.com>',
      to: to,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">Password Reset OTP</h2>
          <p>You requested a password reset. Please use the following 6-digit OTP code to reset your password:</p>
          <div style="margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (ENV.NODE_ENV !== 'production') {
      console.log('Preview URL for Password Reset OTP Email: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send password reset OTP email:', error);
    throw new Error('Email could not be sent');
  }
}

export async function sendNewMessageEmail(to: string, senderName: string, subject: string, contentPreview: string) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Enterprise EMS" <noreply@enterprise-ems.com>',
      to: to,
      subject: `New Message from ${senderName}: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1f2937;">You have a new message!</h2>
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #10b981; color: #374151;">
            ${contentPreview}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Please log in to your Enterprise EMS dashboard to reply.</p>
        </div>
      `,
    });

    if (ENV.NODE_ENV !== 'production') {
      console.log('Preview URL for New Message Email: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send new message email:', error);
  }
}
