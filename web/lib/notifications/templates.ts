// Email + in-app templates. Plain TS so they work in any runtime.
// HTML is intentionally minimal — most email clients still ignore CSS.
//
// Each template returns { subject, html, text } given a typed `data` shape.
// Add new templates by appending to TEMPLATES below.

import type { NotificationTemplate } from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gb-elaaj.vercel.app";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Gb Elaaj";

type TemplateData = Record<string, string | number>;
type Rendered = { subject: string; html: string; text: string };

function shell(content: { heading: string; body: string; ctaUrl?: string; ctaLabel?: string }): string {
  const cta = content.ctaUrl
    ? `<p style="margin:24px 0">
         <a href="${content.ctaUrl}" style="display:inline-block;padding:12px 22px;background:#0B84FE;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${content.ctaLabel ?? "Open"}</a>
       </p>`
    : "";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F4FAFF;color:#102033">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border:1px solid #D9E8F7;border-radius:14px;padding:32px;text-align:left">
        <tr><td>
          <div style="font-size:13px;color:#0B84FE;font-weight:700;letter-spacing:0.16em;text-transform:uppercase">${APP_NAME}</div>
          <h1 style="margin:14px 0 12px 0;font-size:22px;color:#062A4F">${content.heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#102033">${content.body}</div>
          ${cta}
          <hr style="border:0;border-top:1px solid #D9E8F7;margin:28px 0"/>
          <p style="font-size:12px;color:#5F7187">${APP_NAME} — Pakistan's connected healthcare platform.<br/>If you didn't expect this email, you can ignore it safely.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const TEMPLATES: Record<NotificationTemplate, (d: TemplateData) => Rendered> = {
  "auth.email-verify": (d) => ({
    subject: `Verify your ${APP_NAME} email`,
    html: shell({
      heading: "Verify your email",
      body: `Welcome to ${APP_NAME}, ${d.name ?? "there"}. Confirm this email to activate your account. The link expires in 24 hours.`,
      ctaUrl: `${APP_URL}/verify-email/${d.token}`,
      ctaLabel: "Verify my email",
    }),
    text: `Verify your ${APP_NAME} email by visiting:\n${APP_URL}/verify-email/${d.token}\n\nLink expires in 24 hours. If you didn't sign up, ignore this email.`,
  }),

  "auth.password-reset": (d) => ({
    subject: `Reset your ${APP_NAME} password`,
    html: shell({
      heading: "Reset your password",
      body: `We received a request to reset the password on your ${APP_NAME} account. The link expires in 1 hour. If you didn't request this, you can ignore this email — your password stays the same.`,
      ctaUrl: `${APP_URL}/reset-password/${d.token}`,
      ctaLabel: "Choose a new password",
    }),
    text: `Reset your ${APP_NAME} password:\n${APP_URL}/reset-password/${d.token}\n\nLink expires in 1 hour. If you didn't request this, ignore this email.`,
  }),

  "auth.phone-otp": (d) => ({
    subject: `Your ${APP_NAME} verification code`,
    html: shell({
      heading: "Your verification code",
      body: `Your code is <strong style="font-size:22px;letter-spacing:2px">${d.code}</strong>.<br/>It expires in 10 minutes.`,
    }),
    text: `Your ${APP_NAME} code: ${d.code} (expires in 10 minutes).`,
  }),

  "appointment.confirmed": (d) => ({
    subject: `Appointment confirmed with ${d.doctorName}`,
    html: shell({
      heading: "Appointment confirmed",
      body: `Your appointment with <strong>${d.doctorName}</strong> on <strong>${d.when}</strong> is confirmed.<br/><br/>Type: ${d.mode}<br/>${d.feeText ? `Fee: ${d.feeText}<br/>` : ""}`,
      ctaUrl: `${APP_URL}/patient/appointments/${d.appointmentId}`,
      ctaLabel: "View appointment",
    }),
    text: `Your appointment with ${d.doctorName} on ${d.when} is confirmed.\n${APP_URL}/patient/appointments/${d.appointmentId}`,
  }),

  "appointment.reminder": (d) => ({
    subject: `Reminder: appointment in 2 hours`,
    html: shell({
      heading: "Appointment reminder",
      body: `This is a reminder of your upcoming appointment with <strong>${d.doctorName}</strong> at <strong>${d.when}</strong>.`,
      ctaUrl: `${APP_URL}/patient/appointments/${d.appointmentId}`,
      ctaLabel: "Open appointment",
    }),
    text: `Reminder: appointment with ${d.doctorName} at ${d.when}.\n${APP_URL}/patient/appointments/${d.appointmentId}`,
  }),

  "appointment.cancelled": (d) => ({
    subject: `Appointment cancelled`,
    html: shell({
      heading: "Appointment cancelled",
      body: `Your appointment with <strong>${d.doctorName}</strong> scheduled for <strong>${d.when}</strong> has been cancelled. ${d.reason ? `Reason: ${d.reason}` : ""}`,
    }),
    text: `Your appointment with ${d.doctorName} (${d.when}) was cancelled.${d.reason ? ` Reason: ${d.reason}` : ""}`,
  }),

  "lab.report.ready": (d) => ({
    subject: `Lab report ready: ${d.testName}`,
    html: shell({
      heading: "Your lab report is ready",
      body: `Your <strong>${d.testName}</strong> report from ${d.labName} is now available in your account.`,
      ctaUrl: `${APP_URL}/patient/lab-reports`,
      ctaLabel: "View report",
    }),
    text: `Lab report ready: ${d.testName} from ${d.labName}.\n${APP_URL}/patient/lab-reports`,
  }),

  "pharmacy.order.update": (d) => ({
    subject: `Order ${d.status}`,
    html: shell({
      heading: `Order ${d.status}`,
      body: `Your pharmacy order is now <strong>${d.status}</strong>.${d.eta ? ` ETA: ${d.eta}` : ""}`,
      ctaUrl: `${APP_URL}/patient/pharmacy/orders/${d.orderId}`,
      ctaLabel: "Track order",
    }),
    text: `Pharmacy order is ${d.status}. ${APP_URL}/patient/pharmacy/orders/${d.orderId}`,
  }),

  "home-care.assignment": (d) => ({
    subject: `Nurse ${d.action}`,
    html: shell({
      heading: `Home care update`,
      body: `${d.body}`,
      ctaUrl: `${APP_URL}/patient/home-care`,
      ctaLabel: "Open home care",
    }),
    text: `Home care update: ${d.body}`,
  }),

  "withdrawal.status": (d) => ({
    subject: `Withdrawal ${d.status}`,
    html: shell({
      heading: `Withdrawal ${d.status}`,
      body: `Your withdrawal request for <strong>${d.amount}</strong> is now <strong>${d.status}</strong>.${d.note ? `<br/>Note: ${d.note}` : ""}`,
      ctaUrl: `${APP_URL}/${d.providerRoleHomePath}`,
      ctaLabel: "Open earnings",
    }),
    text: `Withdrawal ${d.status}: ${d.amount}.${d.note ? ` Note: ${d.note}` : ""}`,
  }),

  "doctor.verification.status": (d) => ({
    subject: `Doctor verification ${d.status}`,
    html: shell({
      heading: `Verification ${d.status}`,
      body: `Your doctor account verification status is now <strong>${d.status}</strong>.${d.note ? `<br/>Note from review: ${d.note}` : ""}`,
      ctaUrl: `${APP_URL}/doctor/dashboard`,
      ctaLabel: "Open dashboard",
    }),
    text: `Doctor verification: ${d.status}.${d.note ? ` Note: ${d.note}` : ""}`,
  }),

  "support.ticket": (d) => ({
    subject: `Support: ${d.subject}`,
    html: shell({
      heading: `Support ticket`,
      body: `${d.body}`,
    }),
    text: `${d.body}`,
  }),
};

export function renderTemplate(template: NotificationTemplate, data: TemplateData): Rendered {
  const fn = TEMPLATES[template];
  if (!fn) {
    return {
      subject: `Notification from ${APP_NAME}`,
      html: shell({ heading: "Notification", body: JSON.stringify(data) }),
      text: JSON.stringify(data),
    };
  }
  return fn(data);
}
