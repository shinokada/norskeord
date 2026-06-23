#!/usr/bin/env node
/**
 * patch-contact-messages.mjs
 *
 * Adds i18n keys for the new /contact page to all 4 locale files.
 *
 * New keys added:
 *   nav_contact, footer_contact
 *   contact_page_title, contact_heading, contact_subheading,
 *   contact_subheading_plus, contact_email_label, contact_email_placeholder,
 *   contact_email_hint_loggedin, contact_subject_label, contact_message_label,
 *   contact_message_placeholder, contact_submit, contact_sending,
 *   contact_sent_heading, contact_sent_body, contact_sent_body_plus,
 *   contact_error_email, contact_error_subject, contact_error_message,
 *   contact_error_generic, contact_error_bot_check, contact_privacy_note
 *
 * Updated keys:
 *   guide_faq_contact_a  — updated to point to the new /contact page
 *
 * Usage (from the norskeord project root):
 *   node scripts/patch-contact-messages.mjs
 */

import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// ---------------------------------------------------------------------------
// Translations per locale
// ---------------------------------------------------------------------------

const patches = {
  'en.json': {
    // Nav & footer
    nav_contact: 'Contact',
    footer_contact: 'Contact',

    // Page content
    contact_page_title: 'Contact support',
    contact_heading: 'Contact support',
    contact_subheading: "Send us a message and we'll reply to your email.",
    contact_subheading_plus:
      "As a Plus member you get priority support — we'll reply within 1 business day.",
    contact_email_label: 'Your email',
    contact_email_placeholder: 'your@email.com',
    contact_email_hint_loggedin: 'Replies go to your account email.',
    contact_subject_label: 'Subject',
    contact_message_label: 'Message',
    contact_message_placeholder: 'Describe your issue or question…',
    contact_submit: 'Send message',
    contact_sending: 'Sending…',

    // Success state
    contact_sent_heading: 'Message sent!',
    contact_sent_body: "We'll reply to {email} within 1–2 business days.",
    contact_sent_body_plus: "We'll reply to {email} within 1 business day.",

    // Errors
    contact_error_email: 'Please enter a valid email address.',
    contact_error_subject: 'Please select a subject.',
    contact_error_message: 'Please enter a message (at least 10 characters).',
    contact_error_generic: 'Failed to send. Please try again.',
    contact_error_bot_check: 'Bot check failed. Please try again.',

    // Footer note
    contact_privacy_note:
      'Your IP address and browser info are collected with this message for abuse prevention.',

    // Guide FAQ update
    guide_faq_contact_a:
      'Use the Contact page — find it in the Help menu at the top of any page or in the footer. Plus members get priority replies within 1 business day.'
  },

  'nb.json': {
    nav_contact: 'Kontakt',
    footer_contact: 'Kontakt',

    contact_page_title: 'Kontakt støtte',
    contact_heading: 'Kontakt støtte',
    contact_subheading: 'Send oss en melding, så svarer vi på e-posten din.',
    contact_subheading_plus:
      'Som Plus-medlem får du prioritert støtte — vi svarer innen 1 virkedag.',
    contact_email_label: 'Din e-post',
    contact_email_placeholder: 'din@epost.no',
    contact_email_hint_loggedin: 'Svar sendes til e-postadressen for kontoen din.',
    contact_subject_label: 'Emne',
    contact_message_label: 'Melding',
    contact_message_placeholder: 'Beskriv problemet eller spørsmålet ditt…',
    contact_submit: 'Send melding',
    contact_sending: 'Sender…',

    contact_sent_heading: 'Meldingen er sendt!',
    contact_sent_body: 'Vi svarer til {email} innen 1–2 virkedager.',
    contact_sent_body_plus: 'Vi svarer til {email} innen 1 virkedag.',

    contact_error_email: 'Oppgi en gyldig e-postadresse.',
    contact_error_subject: 'Velg et emne.',
    contact_error_message: 'Skriv en melding (minst 10 tegn).',
    contact_error_generic: 'Kunne ikke sende. Prøv igjen.',
    contact_error_bot_check: 'Bot-sjekken mislyktes. Prøv igjen.',

    contact_privacy_note:
      'IP-adressen og nettleserinformasjonen din samles inn med denne meldingen for å forebygge misbruk.',

    guide_faq_contact_a:
      'Bruk Kontakt-siden — finn den i Hjelp-menyen øverst på siden eller i bunnteksten. Plus-medlemmer får prioritert svar innen 1 virkedag.'
  },

  'es.json': {
    nav_contact: 'Contacto',
    footer_contact: 'Contacto',

    contact_page_title: 'Contactar con soporte',
    contact_heading: 'Contactar con soporte',
    contact_subheading: 'Envíanos un mensaje y te responderemos por correo.',
    contact_subheading_plus:
      'Como miembro Plus obtienes soporte prioritario — te respondemos en 1 día hábil.',
    contact_email_label: 'Tu correo electrónico',
    contact_email_placeholder: 'tu@correo.com',
    contact_email_hint_loggedin: 'Las respuestas van al correo de tu cuenta.',
    contact_subject_label: 'Asunto',
    contact_message_label: 'Mensaje',
    contact_message_placeholder: 'Describe tu problema o pregunta…',
    contact_submit: 'Enviar mensaje',
    contact_sending: 'Enviando…',

    contact_sent_heading: '¡Mensaje enviado!',
    contact_sent_body: 'Te responderemos a {email} en 1–2 días hábiles.',
    contact_sent_body_plus: 'Te responderemos a {email} en 1 día hábil.',

    contact_error_email: 'Por favor, introduce un correo electrónico válido.',
    contact_error_subject: 'Por favor, selecciona un asunto.',
    contact_error_message: 'Por favor, escribe un mensaje (al menos 10 caracteres).',
    contact_error_generic: 'No se pudo enviar. Inténtalo de nuevo.',
    contact_error_bot_check: 'Verificación de bot fallida. Inténtalo de nuevo.',

    contact_privacy_note:
      'Tu dirección IP e información del navegador se recopilan con este mensaje para prevenir el abuso.',

    guide_faq_contact_a:
      'Usa la página de Contacto — encuéntrala en el menú Ayuda en la parte superior de cualquier página o en el pie de página. Los miembros Plus reciben respuestas prioritarias en 1 día hábil.'
  },

  'uk.json': {
    nav_contact: 'Контакт',
    footer_contact: 'Контакт',

    contact_page_title: "Зв'язатися з підтримкою",
    contact_heading: "Зв'язатися з підтримкою",
    contact_subheading: 'Надішліть нам повідомлення, і ми відповімо на вашу пошту.',
    contact_subheading_plus:
      'Як Plus-учасник ви отримуєте пріоритетну підтримку — відповідь протягом 1 робочого дня.',
    contact_email_label: 'Ваша електронна пошта',
    contact_email_placeholder: 'ваш@email.com',
    contact_email_hint_loggedin: 'Відповіді надходять на пошту вашого облікового запису.',
    contact_subject_label: 'Тема',
    contact_message_label: 'Повідомлення',
    contact_message_placeholder: 'Опишіть вашу проблему або запитання…',
    contact_submit: 'Надіслати повідомлення',
    contact_sending: 'Надсилання…',

    contact_sent_heading: 'Повідомлення надіслано!',
    contact_sent_body: 'Ми відповімо на {email} протягом 1–2 робочих днів.',
    contact_sent_body_plus: 'Ми відповімо на {email} протягом 1 робочого дня.',

    contact_error_email: 'Введіть дійсну адресу електронної пошти.',
    contact_error_subject: 'Виберіть тему.',
    contact_error_message: 'Введіть повідомлення (щонайменше 10 символів).',
    contact_error_generic: 'Не вдалося надіслати. Спробуйте ще раз.',
    contact_error_bot_check: 'Перевірка бота не пройдена. Спробуйте ще раз.',

    contact_privacy_note:
      'Ваша IP-адреса та інформація браузера збираються разом з цим повідомленням для запобігання зловживанням.',

    guide_faq_contact_a:
      'Скористайтеся сторінкою Контакт — знайдіть її у меню Допомога вгорі будь-якої сторінки або в підвалі сайту. Plus-учасники отримують пріоритетні відповіді протягом 1 робочого дня.'
  }
};

// ---------------------------------------------------------------------------
// Where to insert the new nav key (after the last existing nav_ key)
// and the contact block (after guide_faq_contact_q)
// ---------------------------------------------------------------------------

const NAV_ANCHOR = 'nav_my_stats'; // nav_contact, footer_contact inserted after this
const CONTACT_ANCHOR = 'guide_faq_contact_q'; // contact_* block inserted after this
const GUIDE_UPDATE_KEY = 'guide_faq_contact_a'; // existing key to update in-place

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Insert entries into an ordered array of [key, value] pairs after a named key.
 * If the anchor is not found, appends to the end.
 */
function insertAfter(entries, anchorKey, newEntries) {
  const idx = entries.findIndex(([k]) => k === anchorKey);
  if (idx === -1) {
    console.warn(`  ⚠ Anchor "${anchorKey}" not found — appending to end.`);
    entries.push(...newEntries);
  } else {
    entries.splice(idx + 1, 0, ...newEntries);
  }
}

// ---------------------------------------------------------------------------
// Main
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
  let entries = Object.entries(JSON.parse(raw));

  const alreadyHas = (k) => entries.some(([key]) => key === k);

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // 1. Update guide_faq_contact_a in-place (it already exists in all locales).
  const guideIdx = entries.findIndex(([k]) => k === GUIDE_UPDATE_KEY);
  if (guideIdx !== -1) {
    entries[guideIdx][1] = changes[GUIDE_UPDATE_KEY];
    updated++;
  } else {
    console.warn(`  ⚠ ${filename}: "${GUIDE_UPDATE_KEY}" not found, skipping update.`);
    skipped++;
  }

  // 2. Insert nav_contact + footer_contact after NAV_ANCHOR (if not already present).
  const navEntries = [
    ['nav_contact', changes.nav_contact],
    ['footer_contact', changes.footer_contact]
  ].filter(([k]) => {
    if (alreadyHas(k)) {
      skipped++;
      return false;
    }
    return true;
  });

  if (navEntries.length > 0) {
    insertAfter(entries, NAV_ANCHOR, navEntries);
    added += navEntries.length;
  }

  // 3. Insert the full contact_* block after CONTACT_ANCHOR.
  const contactKeys = [
    'contact_page_title',
    'contact_heading',
    'contact_subheading',
    'contact_subheading_plus',
    'contact_email_label',
    'contact_email_placeholder',
    'contact_email_hint_loggedin',
    'contact_subject_label',
    'contact_message_label',
    'contact_message_placeholder',
    'contact_submit',
    'contact_sending',
    'contact_sent_heading',
    'contact_sent_body',
    'contact_sent_body_plus',
    'contact_error_email',
    'contact_error_subject',
    'contact_error_message',
    'contact_error_generic',
    'contact_error_bot_check',
    'contact_privacy_note'
  ];

  const contactEntries = contactKeys
    .filter((k) => {
      if (alreadyHas(k)) {
        skipped++;
        return false;
      }
      return true;
    })
    .map((k) => [k, changes[k]]);

  if (contactEntries.length > 0) {
    insertAfter(entries, CONTACT_ANCHOR, contactEntries);
    added += contactEntries.length;
  }

  // 4. Write back — rebuild object from ordered entries, 2-space indent + trailing newline.
  const rebuilt = Object.fromEntries(entries);
  fs.writeFileSync(filePath, JSON.stringify(rebuilt, null, 2) + '\n', 'utf-8');

  console.log(
    `✓ ${filename}  (added: ${added}, updated: ${updated}, skipped/already-present: ${skipped})`
  );
}

if (hasError) {
  process.exit(1);
} else {
  console.log('\nDone. Paraglide will pick up the new keys on next dev server start or build.');
}
