/* eslint-disable @typescript-eslint/ban-ts-comment */
import nodemailer from "nodemailer";
import config from "../config";

type TEmail = {
  to: string;
  html: string;
  subject: string;
};

export const sendMail = async ({ to, html, subject }: TEmail) => {
  const transporter = nodemailer.createTransport({
    //@ts-ignore
    host: "smtp.mail.us-east-1.awsapps.com",
    port: 465,
    secure: true,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: config.email.user, // sender address
    to, // list of receivers
    subject,
    html,
  });
};
