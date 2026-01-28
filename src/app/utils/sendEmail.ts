import nodemailer from "nodemailer";
import { envVars } from "../config/env";

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER_SMTP_HOST,
    service: "gmail",
    port: Number(envVars.EMAIL_SENDER_SMTP_PORT),
    secure: false,
    auth: {
      user: envVars.EMAIL_SENDER_SMTP_USER,
      pass: envVars.EMAIL_SENDER_SMTP_PASS,
    },
  });

  // Email options
  const mailOptions = {
    from: `"Your Tuition" <${envVars.EMAIL_SENDER_SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
