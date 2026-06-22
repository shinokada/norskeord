#!/usr/bin/env npx tsx
/**
 * patch-login-messages.mjs
 *
 * Patches all 4 message files for the OTP login flow:
 *   - Updates: login_subheading, login_submit, login_success_body
 *   - Adds:    login_otp_label, login_otp_placeholder, login_otp_submit,
 *              login_otp_verifying, login_error_otp_invalid,
 *              login_resend, login_resending, login_resend_sent
 *   - Removes: login_no_password_note
 *
 * Usage (from the norskeord project root):
 *   npx tsx scripts/patch-login-messages.mjs
 *
 * Or run directly if tsx is installed globally:
 *   tsx scripts/patch-login-messages.mjs
 */

import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// ---------------------------------------------------------------------------
// New / updated values per locale
// ---------------------------------------------------------------------------

const patches = {
  'en.json': {
    // Updated
    login_subheading: "Enter your email — we'll send a 6-digit code, no password needed.",
    login_submit: 'Send code',
    login_success_body: 'We sent a 6-digit code to {email}. Enter it below.',
    // Added
    login_otp_label: '6-digit code',
    login_otp_placeholder: '123456',
    login_otp_submit: 'Verify code',
    login_otp_verifying: 'Verifying…',
    login_error_otp_invalid: 'Invalid or expired code. Please request a new one.',
    login_resend: 'Resend code',
    login_resending: 'Resending…',
    login_resend_sent: 'New code sent.',
    // Removed (null = delete)
    login_no_password_note: null
  },

  'nb.json': {
    // Updated
    login_subheading:
      'Skriv inn e-postadressen din — vi sender en 6-sifret kode, ingen passord nødvendig.',
    login_submit: 'Send kode',
    login_success_body: 'Vi sendte en 6-sifret kode til {email}. Skriv den inn nedenfor.',
    // Added
    login_otp_label: '6-sifret kode',
    login_otp_placeholder: '123456',
    login_otp_submit: 'Bekreft kode',
    login_otp_verifying: 'Bekrefter…',
    login_error_otp_invalid: 'Ugyldig eller utløpt kode. Be om en ny.',
    login_resend: 'Send kode på nytt',
    login_resending: 'Sender…',
    login_resend_sent: 'Ny kode er sendt.',
    // Removed
    login_no_password_note: null
  },

  'es.json': {
    // Updated
    login_subheading: 'Introduce tu correo — te enviaremos un código de 6 dígitos, sin contraseña.',
    login_submit: 'Enviar código',
    login_success_body: 'Enviamos un código de 6 dígitos a {email}. Introdúcelo a continuación.',
    // Added
    login_otp_label: 'Código de 6 dígitos',
    login_otp_placeholder: '123456',
    login_otp_submit: 'Verificar código',
    login_otp_verifying: 'Verificando…',
    login_error_otp_invalid: 'Código inválido o expirado. Solicita uno nuevo.',
    login_resend: 'Reenviar código',
    login_resending: 'Enviando…',
    login_resend_sent: 'Nuevo código enviado.',
    // Removed
    login_no_password_note: null
  },

  'uk.json': {
    // Updated
    login_subheading: 'Введіть свою пошту — ми надішлемо 6-значний код, пароль не потрібен.',
    login_submit: 'Надіслати код',
    login_success_body: 'Ми надіслали 6-значний код на {email}. Введіть його нижче.',
    // Added
    login_otp_label: '6-значний код',
    login_otp_placeholder: '123456',
    login_otp_submit: 'Підтвердити код',
    login_otp_verifying: 'Перевірка…',
    login_error_otp_invalid: 'Недійсний або застарілий код. Запросіть новий.',
    login_resend: 'Надіслати код ще раз',
    login_resending: 'Надсилання…',
    login_resend_sent: 'Новий код надіслано.',
    // Removed
    login_no_password_note: null
  }
};

// Keys to insert after this anchor key (keeps login block together)
const INSERT_AFTER = 'login_error_generic';

// ---------------------------------------------------------------------------
// Patch logic
// ---------------------------------------------------------------------------

let hasError = false;

for (const [filename, changes] of Object.entries(patches)) {
  const filePath = path.join(MESSAGES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`✗ Not found: ${filePath}`);
    hasError = true;
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);

  // 1. Apply updates to existing keys
  const toUpdate = Object.entries(changes).filter(([k, v]) => v !== null && k in json);

  for (const [key, value] of toUpdate) {
    json[key] = value;
  }

  // 2. Insert new keys after the anchor, preserving order
  const toAdd = Object.entries(changes).filter(([k, v]) => v !== null && !(k in json));

  if (toAdd.length > 0) {
    const entries = Object.entries(json);
    const anchorIndex = entries.findIndex(([k]) => k === INSERT_AFTER);
    if (anchorIndex === -1) {
      console.error(`✗ Anchor key "${INSERT_AFTER}" not found in ${filename}`);
      hasError = true;
      continue;
    }
    entries.splice(anchorIndex + 1, 0, ...toAdd);
    // Rebuild object preserving insertion order
    const rebuilt = {};
    for (const [k, v] of entries) rebuilt[k] = v;
    Object.assign(json, rebuilt);
    // Replace json contents with rebuilt order
    const reordered = {};
    for (const [k, v] of entries) reordered[k] = v;
    Object.keys(json).forEach((k) => delete json[k]);
    Object.assign(json, reordered);
  }

  // 3. Remove deleted keys
  const toRemove = Object.entries(changes)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  for (const key of toRemove) {
    delete json[key];
  }

  // 4. Write back with consistent 2-space indent + trailing newline
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');

  const updatedCount = toUpdate.length;
  const addedCount = toAdd.length;
  const removedCount = toRemove.filter((k) => k in JSON.parse(raw)).length;
  console.log(
    `✓ ${filename}  (updated: ${updatedCount}, added: ${addedCount}, removed: ${removedCount})`
  );
}

if (hasError) {
  process.exit(1);
} else {
  console.log('\nDone. Run `pnpm check` to verify no TypeScript errors.');
}
