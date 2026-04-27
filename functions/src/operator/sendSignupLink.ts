import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { db } from "../shared/firebase";
import { assertSuperAdmin } from "../shared/helpers";

const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const smtpFrom = defineSecret("SMTP_FROM");

export const sendSignupLinkEmail = onCall(
  {
    region: "us-central1",
    invoker: "public",
    cors: true,
    secrets: [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    await assertSuperAdmin(request.auth.uid);

    const { recipientEmail, signupUrl } = request.data as {
      recipientEmail?: string;
      signupUrl?: string;
    };

    if (!recipientEmail || typeof recipientEmail !== "string") {
      throw new HttpsError("invalid-argument", "recipientEmail is required.");
    }
    if (!signupUrl || typeof signupUrl !== "string") {
      throw new HttpsError("invalid-argument", "signupUrl is required.");
    }

    const snap = await db.doc("app_config/operator_signup_link").get();
    if (!snap.exists) {
      throw new HttpsError(
        "not-found",
        "No signup link generated. Generate one first."
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost.value(),
      port: parseInt(smtpPort.value(), 10),
      secure: parseInt(smtpPort.value(), 10) === 465,
      auth: {
        user: smtpUser.value(),
        pass: smtpPass.value(),
      },
    });

    await transporter.sendMail({
      from: smtpFrom.value(),
      to: recipientEmail,
      subject: "Operator Registration Invitation",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#558B2F">Operator Registration</h2>
          <p>You have been invited to register as an operator on the Management Portal.</p>
          <p>Click the button below to complete your registration. This link can only be used <strong>once</strong>.</p>
          <a href="${signupUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#558B2F;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
            Complete Registration
          </a>
          <p style="color:#888;font-size:12px">If the button doesn't work, copy this link: ${signupUrl}</p>
        </div>
      `,
    });

    logger.info(`Signup link email sent to ${recipientEmail}`);
    return { success: true };
  }
);
