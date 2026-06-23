#!/usr/bin/env node
/**
 * patch-contact-cleanup.mjs
 *
 * Step 4 + 5 of the contact page implementation:
 *
 *   1. my-profile/+page.svelte   — remove ContactSupport import + usage
 *   2. my-profile/+page.server.ts — remove the `supportContact` action
 *   3. guide/+page.svelte        — remove the ✶ Plus badge from the contact
 *                                   FAQ answer and add a link to /contact
 *
 * Usage (from the norskeord project root):
 *   node scripts/patch-contact-cleanup.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function patch(relPath, replacements) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Not found: ${filePath}`);
    process.exit(1);
  }
  let src = fs.readFileSync(filePath, 'utf-8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (!src.includes(from)) {
      console.error(`✗ Could not find expected string in ${relPath}:\n  "${from.slice(0, 100)}"`);
      process.exit(1);
    }
    src = src.replace(from, to);
    count++;
  }
  fs.writeFileSync(filePath, src, 'utf-8');
  console.log(`✓ ${relPath}  (${count} replacement${count !== 1 ? 's' : ''})`);
}

// ── 1. my-profile/+page.svelte ────────────────────────────────────────────────

patch('src/routes/my-profile/+page.svelte', [
  // Remove the import
  [`  import ContactSupport from './ContactSupport.svelte';\n`, ``],
  // Remove the usage (including trailing newline for clean spacing)
  [`    <ContactSupport isPlus={data.plan === 'plus'} />\n`, ``]
]);

// ── 2. my-profile/+page.server.ts — remove supportContact action ──────────────
//
// The action spans from `supportContact: async` to the closing `}` of the
// actions object. We remove just the action body, leaving the rest intact.

patch('src/routes/my-profile/+page.server.ts', [
  [
    `  supportContact: async ({ request, locals }) => {
    if (!locals.user) redirect(302, '/auth/login');
    // Available to all logged-in users (free + plus)

    const data = await request.formData();
    const subject = ((data.get('subject') as string) ?? '').trim();
    const message = ((data.get('message') as string) ?? '').trim();
    const appVersion = ((data.get('app_version') as string) ?? '').trim();
    const honeypot = ((data.get('website') as string) ?? '').trim();

    // Honeypot check: bots fill in hidden fields, humans don't
    if (honeypot) {
      // Silently succeed so bots don't know they were caught
      return { success: true, action: 'supportContact' };
    }

    if (!subject) return fail(422, { field: 'supportContact', message: 'Please enter a subject.' });
    if (message.length < 10)
      return fail(422, {
        field: 'supportContact',
        message: 'Please enter a message (at least 10 characters).'
      });
    if (message.length > 2000)
      return fail(422, {
        field: 'supportContact',
        message: 'Message is too long (max 2000 characters).'
      });

    // Collect fingerprint fields for abuse prevention (GDPR: legitimate interest, disclosed in privacy policy)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      null;
    const userAgent = request.headers.get('user-agent') ?? null;

    const profile = await getProfile(locals.supabase, locals.user.id);
    const fromName = profile?.display_name ?? (locals.plan === 'plus' ? 'A Plus member' : 'A user');
    const fromEmail = locals.user.email ?? 'unknown';

    // Store in DB via service role (bypasses RLS)
    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert({
      user_id: locals.user.id,
      subject,
      message,
      app_version: appVersion || null,
      ip_address: ip,
      user_agent: userAgent
    });
    if (dbError) {
      console.error('[supportContact] DB insert failed:', dbError.message);
      // Non-fatal: still attempt to send the email
    }

    // Look up ADMIN_USER_ID's email to send to
    const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(ADMIN_USER_ID);
    const adminEmail = adminData?.user?.email;

    if (!adminEmail) {
      console.error('[supportContact] Could not resolve admin email');
      return fail(500, {
        field: 'supportContact',
        message: 'Could not send message. Please try again.'
      });
    }

    const planLabel = locals.plan === 'plus' ? 'Plus' : 'Free';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${RESEND_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: adminEmail,
        reply_to: fromEmail,
        subject: \`[\${planLabel} Support] \${subject}\`,
        text: \`From: \${fromName} <\${fromEmail}>\\nUser ID: \${locals.user.id}\\nPlan: \${planLabel}\\nApp version: \${appVersion || 'unknown'}\\nIP: \${ip ?? 'unknown'}\\n\\n\${message}\`
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[supportContact] Resend error:', res.status, body);
      return fail(500, {
        field: 'supportContact',
        message: 'Failed to send message. Please try again.'
      });
    }

    return { success: true, action: 'supportContact' };
  }`,
    `  // supportContact removed — now handled by /contact/+page.server.ts`
  ]
]);

// ── 3. guide/+page.svelte — contact FAQ: remove Plus badge, add /contact link ─

patch('src/routes/guide/+page.svelte', [
  [
    `      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_contact_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_contact_a()}
          <span
            class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
            >✶ Plus</span
          >
        </p>
      </div>`,
    `      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_contact_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_contact_a()}
          <a href="/contact" class="underline">{m.nav_contact()}</a>
        </p>
      </div>`
  ]
]);

console.log('\nDone. Run `pnpm check` to verify, then delete ContactSupport.svelte manually.');
