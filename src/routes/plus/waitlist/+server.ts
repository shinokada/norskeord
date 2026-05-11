import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.from('waitlist').insert({ email });

  if (error?.code === '23505') {
    // Unique violation — already on the list. Treat as success so we don't leak info.
    return json({ message: 'Success' });
  }

  if (error) {
    console.error('Waitlist insert error:', error);
    return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return json({ message: 'Success' });
};
