const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Define email options
  const mailOptions = {
    from: `StockMaster <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // In development, just log the OTP instead of sending email
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Development Mode - OTP:', options.otp || 'N/A');
      return { success: true, messageId: 'dev-mode' };
    }
    
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;