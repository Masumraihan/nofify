import nodemailer from "nodemailer";
import config from "../config";

const emailSender = async (receiverEmail: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper
  const info = await transporter.sendMail({
    from: config.email.user, // sender address
    to: receiverEmail, // list of receivers
    subject, // Subject line
    html, // html body
  });
};

export default emailSender;
