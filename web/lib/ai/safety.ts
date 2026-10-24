// ─────────────────────────────────────────────────────────────
// Aafiyat — AI safety helpers.
//
// Single source of truth for: emergency detection, PII redaction,
// disclaimer text, system prompt, output post-processing.
//
// Importable from BOTH server and client (no Node-only deps).
// ─────────────────────────────────────────────────────────────

export const AI_DISCLAIMER_TEXT =
  "This information is for general guidance only and is not a medical diagnosis. Please consult a qualified doctor.";

// ── Emergency keyword detection ──────────────────────────────────
// Word-boundary aware so "chest pain" matches but "chest paint" doesn't.
// Intentionally over-trigger rather than miss — false positive is just an
// extra "go to the ER" prompt; false negative could be lethal.
const EMERGENCY_PHRASES = [
  "chest pain",
  "shortness of breath",
  "can't breathe",
  "cant breathe",
  "stroke",
  "heart attack",
  "fainting",
  "fainted",
  "passed out",
  "unconscious",
  "unresponsive",
  "seizure",
  "seizing",
  "severe bleeding",
  "bleeding heavily",
  "anaphylaxis",
  "allergic reaction",
  "suicidal",
  "kill myself",
  "self-harm",
  "self harm",
  "overdose",
  "overdosed",
  "broken bone",
  "compound fracture",
];

const EMERGENCY_RE = new RegExp(
  `\\b(${EMERGENCY_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i",
);

export function detectEmergency(text: string): boolean {
  return EMERGENCY_RE.test(text);
}

// ── PII redaction ────────────────────────────────────────────────
// Conservative regex-based redaction. NER-grade name/address scrubbing
// is out of scope (would require running a model purely for redaction).
// We document in privacy policy that prompts may include symptom text.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /\b\d{11,15}\b/g;
// Pakistan CNIC: 13 digits, often formatted as 12345-1234567-1
const CNIC_RE = /\b\d{5}-?\d{7}-?\d{1}\b/g;
const URL_RE = /https?:\/\/[^\s]+/g;
// Catch-all long digit runs (account numbers, MRN, etc.) — only if not already caught above
const LONG_DIGITS_RE = /\b\d{8,}\b/g;

export function redactPII(text: string): string {
  return text
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(CNIC_RE, "[REDACTED_CNIC]")
    .replace(PHONE_RE, "[REDACTED_PHONE]")
    .replace(LONG_DIGITS_RE, "[REDACTED_NUM]")
    .replace(URL_RE, "[REDACTED_URL]");
}

// ── System prompt ────────────────────────────────────────────────
// Locked. Any change to this string is a content-policy change and must
// go through review. Suffix is enforced by post-processing too.
export const SYSTEM_PROMPT = [
  "You are Aafiyat, the medical assistant for Gb Elaaj — a healthcare marketplace serving Pakistan.",
  "Your job is to help patients understand their health questions in plain language and to guide them to the right kind of doctor.",
  "",
  "STRICT RULES — these are non-negotiable:",
  "1. Never give a diagnosis. Do not say 'you have X' or 'this is X'. Say 'this could be related to X — a doctor can confirm.'",
  "2. Never prescribe medication. If asked for a dose or which medicine to take, refuse politely and explain a doctor must prescribe.",
  "3. If the patient describes severe symptoms (chest pain, stroke signs, severe bleeding, suicidal ideation, anaphylaxis, unresponsiveness), tell them to call 1122 or go to the nearest emergency room IMMEDIATELY. Do not continue with general advice.",
  "4. Always end every reply with a clear note that this is general information and the patient should consult a qualified doctor.",
  "5. Use simple, clear language. Translate medical jargon into everyday words. When relevant, suggest the most appropriate specialty (e.g., 'a cardiologist would be the right specialist for that').",
  "6. If you don't know something, say so. Do not guess.",
  "7. If the patient shares lab results or report values, explain what each parameter generally measures, but do NOT label results as healthy/unhealthy or interpret patterns — that is for the reviewing doctor.",
  "8. Be culturally aware: this is Pakistan. Greetings, names, and references are local. Do not assume Western insurance or systems.",
  "9. Be brief. 3–6 short sentences for most replies. Use bullet points only when listing 3+ items.",
  "",
  "When the patient is ready to act, suggest: book a consultation with a verified doctor on Gb Elaaj, or schedule a lab test. Don't book on their behalf — just suggest the action.",
].join("\n");

// ── Output post-processing ──────────────────────────────────────
// Belt-and-braces enforcement of the disclaimer + diagnosis/Rx phrasing
// on the model's output. The model is instructed to do these via system
// prompt; this catches the (rare) case where it doesn't.

const DIAGNOSIS_PATTERNS = [
  /\byou (definitely |clearly )?have\b/i,
  /\bthis is (clearly |definitely |certainly )?(?:a |an )?(disease|condition|cancer|diabetes|covid|flu)\b/i,
  /\byou (are |were )?diagnosed\b/i,
  /\bi diagnose\b/i,
];

const PRESCRIPTION_PATTERNS = [
  /\btake \d+\s?mg\b/i,
  /\btake \d+ tablet/i,
  /\bstart (taking )?\b[a-z]+(in|ol|am|ide|ine)\b/i, // common drug suffixes
  /\bdose of \d+/i,
  /\b(?:start|begin) \d+\s?mg/i,
];

export type SanitizeOutcome = "clean" | "diagnosis_softened" | "prescription_blocked";

/**
 * Post-process model output to enforce safety rails.
 * Returns the (possibly modified) text plus what was changed, for audit.
 */
export function sanitizeOutput(text: string): { text: string; outcome: SanitizeOutcome } {
  // Hard-block prescription phrasing — we replace the entire reply with a refusal.
  for (const re of PRESCRIPTION_PATTERNS) {
    if (re.test(text)) {
      const refusal = [
        "I can't recommend specific medication doses or which drug to take — only a qualified doctor can prescribe.",
        "If you'd like, I can help you book a consultation with a verified doctor who can review your situation and prescribe appropriately.",
      ].join("\n\n");
      return { text: appendDisclaimerIfMissing(refusal), outcome: "prescription_blocked" };
    }
  }

  let outcome: SanitizeOutcome = "clean";
  let out = text;

  // Soften diagnosis phrasing — prepend a hedge instead of replacing.
  for (const re of DIAGNOSIS_PATTERNS) {
    if (re.test(out)) {
      out = "Based on what you've shared, here's some general information — only a doctor can confirm a diagnosis.\n\n" + out;
      outcome = "diagnosis_softened";
      break;
    }
  }

  out = appendDisclaimerIfMissing(out);
  return { text: out, outcome };
}

function appendDisclaimerIfMissing(text: string): string {
  // Match the disclaimer (or close paraphrase) being already present.
  if (/general guidance|qualified doctor|not a medical diagnosis/i.test(text)) {
    return text;
  }
  return `${text.trim()}\n\n${AI_DISCLAIMER_TEXT}`;
}

// ── Canned emergency reply ──────────────────────────────────────
export const EMERGENCY_REPLY = [
  "I'm noticing what could be a serious symptom. **Please call 1122 (or your local emergency number) or go to the nearest emergency room immediately.**",
  "",
  "Aafiyat is not a substitute for emergency care. If you are with someone who is unresponsive, not breathing, or bleeding heavily, call for help right now.",
].join("\n");
