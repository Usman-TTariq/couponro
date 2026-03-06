import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number.isNaN(port) ? 587 : port,
    secure,
    auth: { user, pass },
  });
};

export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

/** Send contact form email. Returns { ok: true } or { ok: false, error: string }. */
export async function sendContactEmail(payload: ContactPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_USER;
  if (!to) {
    return { ok: false, error: "CONTACT_TO_EMAIL or SMTP_USER not set" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required)" };
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@couponro.com";
  const subject = payload.subject
    ? `[Couponro Contact] ${payload.subject}`
    : "[Couponro Contact] New message";

  const text = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");

  const html = [
    "<p><strong>Name:</strong> " + escapeHtml(payload.name) + "</p>",
    "<p><strong>Email:</strong> " + escapeHtml(payload.email) + "</p>",
    "<p><strong>Message:</strong></p>",
    "<pre style='white-space:pre-wrap'>" + escapeHtml(payload.message) + "</pre>",
  ].join("\n");

  try {
    await transporter.sendMail({
      from: typeof from === "string" ? from : "noreply@couponro.com",
      to,
      subject,
      text,
      html,
      replyTo: payload.email,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    console.error("[email] sendContactEmail:", err);
    return { ok: false, error: message };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
