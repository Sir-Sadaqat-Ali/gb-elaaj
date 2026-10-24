// ─────────────────────────────────────────────────────────────
// Gb Elaaj — Manual bank-transfer payment details.
//
// TEMPORARY bridge while the automated gateway (Safepay) is not yet wired.
// Patients see these account details at checkout and transfer the amount
// manually; the platform reconciles payments off-platform.
//
// Values are read from NEXT_PUBLIC_* env vars (so they're available in the
// client checkout components) and fall back to the live account below.
// To change the account or turn this off, set the env vars in Vercel —
// no code change needed.
// ─────────────────────────────────────────────────────────────

export type BankTransferConfig = {
  enabled: boolean;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  /** Optional WhatsApp number patients can send their receipt to. */
  whatsapp: string;
};

export const bankTransfer: BankTransferConfig = {
  enabled: (process.env.NEXT_PUBLIC_BANK_TRANSFER_ENABLED ?? "true") !== "false",
  bankName: process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK ?? "HBL",
  accountTitle: process.env.NEXT_PUBLIC_BANK_TRANSFER_TITLE ?? "ALI MEHDI",
  accountNumber: process.env.NEXT_PUBLIC_BANK_TRANSFER_NUMBER ?? "01077918513303",
  whatsapp: process.env.NEXT_PUBLIC_BANK_TRANSFER_WHATSAPP ?? "",
};
