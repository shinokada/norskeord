/**
 * Domains of throwaway mailbox services, used by `isDisposableEmail` to refuse a free trial
 * (ai-docs/implementation/free-trial.md, decision 9c).
 *
 * Deliberately short and conservative: a wrong entry blocks a real person (the trial
 * endpoint gives the same 409 for every reason, with a contact link). Subdomains of an
 * entry match too. Alias services that people use for privacy (33mail, SimpleLogin,
 * Hide My Email, ...) are NOT listed.
 *
 * The owner reviews this list. To allow a domain again, delete its line.
 */
export const DISPOSABLE_DOMAINS: readonly string[] = [
  '10minutemail.com',
  '10minutemail.net',
  'burnermail.io',
  'discard.email',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getnada.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'inboxkitten.com',
  'maildrop.cc',
  'mailcatch.com',
  'mailinator.com',
  'mailnesia.com',
  'mailsac.com',
  'mintemail.com',
  'moakt.com',
  'mohmal.com',
  'mytemp.email',
  'nada.email',
  'sharklasers.com',
  'spam4.me',
  'spamgourmet.com',
  'tempail.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempr.email',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.de',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net'
];
