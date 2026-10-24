#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// End-to-end probe for /api/video/token on production.
//
// Why: We can't simulate a NextAuth session locally without the demo
// password. This script takes a session cookie (which you copy from
// your browser's DevTools after logging in) and exercises the full
// auth → RBAC → time-window → Agora-token-issuance chain on the live
// prod endpoint, then validates the returned token is structurally
// sound.
//
// Usage:
//   1. Open https://gb-elaaj.vercel.app/login in any browser
//   2. Sign in as demo-doctor@gbelaaj.pk OR demo-patient@gbelaaj.pk
//   3. Open DevTools → Application → Cookies → gb-elaaj.vercel.app
//   4. Find cookie named `__Secure-authjs.session-token` and copy VALUE
//   5. Find a current/upcoming VIDEO appointment ID
//        (visible in the URL when you open the appointment detail)
//   6. Run:
//        SESSION_COOKIE='<paste value>' \
//        APPOINTMENT_ID='<paste id>' \
//        node web/scripts/probe-video-token.mjs
// ─────────────────────────────────────────────────────────────

const PROD = process.env.PROD_URL ?? "https://gb-elaaj.vercel.app";
const COOKIE = process.env.SESSION_COOKIE;
const APPOINTMENT_ID = process.env.APPOINTMENT_ID;

if (!COOKIE || !APPOINTMENT_ID) {
  console.error("Missing SESSION_COOKIE or APPOINTMENT_ID env vars. See header of this file.");
  process.exit(2);
}

const cookieHeader = `__Secure-authjs.session-token=${COOKIE}`;
console.log(`[probe] POST ${PROD}/api/video/token { appointmentId: "${APPOINTMENT_ID}" }`);
console.log(`[probe] Cookie: __Secure-authjs.session-token=${COOKIE.slice(0, 12)}...${COOKIE.slice(-6)} (${COOKIE.length} chars)`);
console.log("");

const res = await fetch(`${PROD}/api/video/token`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
  },
  body: JSON.stringify({ appointmentId: APPOINTMENT_ID }),
});

const body = await res.text();
console.log(`[probe] HTTP ${res.status}`);
let parsed = null;
try { parsed = JSON.parse(body); } catch {}

// Friendly diagnosis of failure modes
if (res.status === 401) {
  console.error(`[probe] 401 — session cookie didn't authenticate. Either:`);
  console.error(`        • cookie value was copied incompletely`);
  console.error(`        • cookie has expired (sign in again)`);
  console.error(`        • cookie name should be __Secure-authjs.session-token (https) — verify in DevTools`);
  console.error(`        Server response: ${body.slice(0, 200)}`);
  process.exit(1);
}
if (res.status === 404) {
  console.error(`[probe] 404 — appointmentId "${APPOINTMENT_ID}" not found in DB`);
  console.error(`        Verify by visiting /patient/appointments/${APPOINTMENT_ID} or /doctor/appointments`);
  process.exit(1);
}
if (res.status === 403) {
  console.error(`[probe] 403 — caller doesn't own this appointment, OR it's cancelled, OR outside time window`);
  console.error(`        Server response: ${body.slice(0, 300)}`);
  process.exit(1);
}
if (res.status === 400) {
  console.error(`[probe] 400 — appointment exists but mode is not VIDEO (it's IN_PERSON or HOME_VISIT)`);
  console.error(`        Try a different appointment, or book a new VIDEO consultation.`);
  console.error(`        Server response: ${body.slice(0, 300)}`);
  process.exit(1);
}
if (res.status === 503) {
  console.error(`[probe] 503 — Agora provider error on server. Check Vercel logs.`);
  process.exit(1);
}
if (res.status !== 200) {
  console.error(`[probe] FAIL — unexpected ${res.status}`);
  console.error(`        Body: ${body.slice(0, 600)}`);
  process.exit(1);
}

if (!parsed?.ok || !parsed?.data) {
  console.error(`[probe] FAIL — got 200 but unexpected shape`);
  console.error(`        Body: ${body.slice(0, 600)}`);
  process.exit(1);
}

const d = parsed.data;
console.log(`[probe] response data:`);
console.log(`         channel    = ${d.channel}`);
console.log(`         appId      = ${d.appId}`);
console.log(`         uid        = ${d.uid}`);
console.log(`         role       = ${d.role}`);
console.log(`         localName  = ${d.localName}`);
console.log(`         remoteName = ${d.remoteName}`);
console.log(`         expiresAt  = ${d.expiresAt}`);
console.log(`         token      = ${d.token?.slice(0, 40)}... (${d.token?.length} chars)`);
console.log("");

const checks = [
  ["token (string, non-empty)",            typeof d.token === "string" && d.token.length > 50],
  ["token starts with 007 (Agora v2)",     d.token?.startsWith?.("007")],
  ["channel matches appt-* format",        /^appt-/.test(d.channel ?? "")],
  ["appId is 32 hex chars",                /^[0-9a-f]{32}$/i.test(d.appId ?? "")],
  ["uid is non-empty string",              typeof d.uid === "string" && d.uid.length > 0],
  ["role is host or participant",          ["host", "participant"].includes(d.role)],
  ["expiresAt is in the future",           !!d.expiresAt && new Date(d.expiresAt).getTime() > Date.now()],
];

let pass = 0, fail = 0;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  ok ? pass++ : fail++;
}

console.log(`\n[probe] ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
