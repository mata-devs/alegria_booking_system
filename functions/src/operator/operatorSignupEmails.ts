import * as logger from "firebase-functions/logger";
import { createTransporter, getFromAddress } from "../shared/mailer";
import { buildAppLoginUrl } from "../shared/appUrl";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text);
}

const emailShell = (title: string, bodyHtml: string) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#333">
    <div style="background:#558B2F;padding:24px 32px;border-radius:8px 8px 0 0">
      <h2 style="margin:0;color:#fff;font-size:22px">${title}</h2>
    </div>
    <div style="padding:28px 32px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      ${bodyHtml}
    </div>
  </div>
`;

const buttonPrimary = (href: string, label: string) => `
  <a href="${escapeHtmlAttr(href)}"
     style="display:inline-block;padding:14px 32px;background:#558B2F;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
    ${label}
  </a>
`;

const buttonOutline = (href: string, label: string) => `
  <a href="${escapeHtmlAttr(href)}"
     style="display:inline-block;padding:12px 28px;border:2px solid #558B2F;color:#558B2F;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
    ${label}
  </a>
`;

export async function sendOperatorSignupApprovedEmail(params: {
  to: string;
  applicantName: string;
  companyName: string;
  setPasswordUrl?: string;
}): Promise<void> {
  const { to, applicantName, companyName, setPasswordUrl } = params;
  const name = escapeHtml(applicantName.trim() || "there");
  const company = escapeHtml(companyName.trim() || "your business");
  const loginUrl = buildAppLoginUrl();
  const loginUrlDisplay = escapeHtml(loginUrl);

  const setupSteps = setPasswordUrl
    ? `
      <ol style="margin:0;padding-left:20px;color:#4b5563;line-height:1.6">
        <li style="margin-bottom:6px">Set your password using the button below.</li>
        <li>Sign in to the operator portal to manage listings and bookings.</li>
      </ol>
    `
    : `
      <p style="margin:0;color:#4b5563;line-height:1.6">
        Use <strong>Forgot password</strong> on the sign-in page with this email address to set your password,
        then sign in to the operator portal.
      </p>
    `;

  const setPasswordButton = setPasswordUrl
    ? `
      <div style="text-align:center;margin:0 0 16px">
        ${buttonOutline(setPasswordUrl, "Set your password")}
      </div>
    `
    : "";

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Your operator application has been approved",
    html: emailShell(
      "Application approved",
      `
          <p style="margin-top:0;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="line-height:1.6">
            Great news — your operator registration for <strong>${company}</strong> has been
            <strong>approved</strong>. Welcome to the VisitCebu operator portal.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;margin:22px 0">
            <p style="margin:0 0 10px;font-weight:600;color:#111827">Get started</p>
            ${setupSteps}
          </div>

          ${setPasswordButton}

          <div style="text-align:center;margin:28px 0 20px">
            ${buttonPrimary(loginUrl, "Sign in to operator portal")}
          </div>

          <p style="color:#888;font-size:12px;line-height:1.5;margin:0;text-align:center">
            Operator portal:
            <a href="${escapeHtmlAttr(loginUrl)}" style="color:#558B2F">${loginUrlDisplay}</a>
          </p>
        `
    ),
  });
  logger.info(`Operator approval email sent to ${to}`);
}

export async function sendOperatorSignupDeclinedEmail(params: {
  to: string;
  applicantName: string;
  companyName: string;
}): Promise<void> {
  const { to, applicantName, companyName } = params;
  const name = escapeHtml(applicantName.trim() || "there");
  const company = escapeHtml(companyName.trim() || "your business");

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Update on your operator application",
    html: emailShell(
      "Application not approved",
      `
          <p style="margin-top:0">Hi <strong>${name}</strong>,</p>
          <p>Thank you for applying to register <strong>${company}</strong> on our platform.</p>
          <p>After review, we are unable to approve your application at this time.</p>
          <p>If you believe this was a mistake or you would like to provide additional information,
            please reply to this email or contact our support team.</p>
          <p style="color:#888;font-size:12px;margin-bottom:0">We appreciate your interest in partnering with us.</p>
        `
    ),
  });
  logger.info(`Operator decline email sent to ${to}`);
}
