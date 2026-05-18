import * as nodemailer from "nodemailer";
import { defineString, defineInt } from "firebase-functions/params";

const smtpHost = defineString("SMTP_HOST");
const smtpPort = defineInt("SMTP_PORT");
const smtpUser = defineString("SMTP_USER");
const smtpPass = defineString("SMTP_PASS");
const smtpFrom = defineString("SMTP_FROM");

export function createTransporter() {
  return nodemailer.createTransport({
    host: smtpHost.value(),
    port: smtpPort.value(),
    secure: smtpPort.value() === 465,
    auth: {
      user: smtpUser.value(),
      pass: smtpPass.value(),
    },
  });
}

export function getFromAddress() {
  return smtpFrom.value();
}
