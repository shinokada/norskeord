<script>
  import { Heading } from 'flowbite-svelte';
</script>

<div class="mx-auto max-w-3xl px-4 py-12 text-left">
  <Heading tag="h1" class="mb-2 text-3xl font-bold dark:text-white">Guide to Norskeord</Heading>
  <p class="mb-8 text-gray-500 dark:text-gray-400">
    A vocabulary app built for serious Norwegian learners.
  </p>

  <p class="mb-6 text-gray-700 dark:text-gray-300">
    Norskeord is a flashcard app for Norwegian learners who want to build vocabulary that actually
    sticks — from everyday A1 words all the way up to C2. It covers all CEFR levels, includes audio
    on every card, and is designed with Norskprøven candidates in mind.
  </p>

  <p class="mb-10 text-gray-700 dark:text-gray-300">
    In Norway, every city and town has dedicated volunteers who offer free Norwegian courses, such
    as Røde Kors Norsktrening. I would like to express my sincere gratitude to all the volunteers
    who are helping us learn Norwegian.
  </p>

  <!-- Smart scheduling section -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >How smart scheduling works</Heading
  >

  <p class="mb-4 text-gray-700 dark:text-gray-300">
    When you flip a card, you rate how well you remembered the word — <strong>Again</strong>,
    <strong>Hard</strong>, <strong>Good</strong>, or <strong>Easy</strong>. The app uses that rating
    to decide when to show you that card again.
  </p>

  <p class="mb-4 text-gray-700 dark:text-gray-300">
    The idea is simple: the best time to review a word is just before you would naturally forget it.
    Review it too soon and you waste time on something you already know. Wait too long and you have
    to relearn it from scratch. Smart scheduling finds the sweet spot.
  </p>

  <p class="mb-4 text-gray-700 dark:text-gray-300">
    Words you find easy come back less often — maybe in a week, then a month, then several months.
    Words you keep forgetting come back sooner, sometimes within the same session. Over time, the
    app builds a personalised schedule for each word based on your own memory.
  </p>

  <p class="mb-10 text-gray-700 dark:text-gray-300">
    This is why rating cards honestly matters. Tapping <strong>Easy</strong> on a word you are not
    sure about will push it out of your deck for a long time. Tapping <strong>Again</strong> on something
    you genuinely forgot brings it back quickly. The more accurately you rate, the more effective your
    study sessions become.
  </p>

  <!-- Rating buttons -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >Which button should I tap?</Heading
  >

  <p class="mb-6 text-gray-700 dark:text-gray-300">
    After flipping a card, ask yourself one question: <em>how easy was it to recall that word?</em>
    Pick the button that honestly matches your experience.
  </p>

  <div class="mb-4 space-y-3">
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block shrink-0 rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
        >Again</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        You could not recall it, guessed wrong, or needed the answer to make sense of the word. The
        card comes back later in the same session so you get another try today.
      </p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block shrink-0 rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        >Hard</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        You got it, but it took real effort — slow, hesitant, or nearly wrong. The next review
        interval grows only a little.
      </p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block shrink-0 rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
        >Good</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        You recalled it correctly with normal effort. This is the right pick for most cards most of
        the time — the scheduling algorithm is built around it.
      </p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block shrink-0 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
        >Easy</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        It felt immediately obvious — no hesitation at all. The next review jumps much further into
        the future. Use it sparingly; overusing Easy can leave gaps in your memory.
      </p>
    </div>
  </div>

  <p class="mb-10 text-gray-700 dark:text-gray-300">
    Not sure which to pick? <strong>Good</strong> is almost always the right default. Use
    <strong>Again</strong> and <strong>Easy</strong> only when the difference is clear-cut — they have
    the biggest effect on your schedule.
  </p>

  <!-- Card states -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >What the progress labels mean</Heading
  >

  <div class="mb-10 space-y-3">
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >New</span
      >
      <p class="text-gray-700 dark:text-gray-300">You have not seen this word yet.</p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
        >Learning</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        You have seen this word but it has not settled into long-term memory yet. Keep rating it and
        it will graduate soon.
      </p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
        >Memorized</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        This word has moved into long-term memory. It will come back for review occasionally to keep
        it fresh.
      </p>
    </div>
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-block rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        >Forgotten</span
      >
      <p class="text-gray-700 dark:text-gray-300">
        You rated this word <em>Again</em> after it was memorized. It is back in practice and will come
        back more frequently until it sticks again.
      </p>
    </div>
  </div>

  <div
    class="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800 dark:bg-blue-900/20"
  >
    <p class="text-sm text-blue-700 dark:text-blue-300">
      <strong>Plus tip:</strong> Norskeord Plus builds a personal <em>Due today</em> deck from your
      ratings — a short, focused session of only the words your memory needs right now.
      <a href="/plus" class="font-semibold underline">Learn more about Plus →</a>
    </p>
  </div>

  <!-- FAQ -->
  <Heading tag="h2" class="mt-12 mb-6 text-2xl font-semibold dark:text-white">FAQ</Heading>

  <div class="space-y-6">
    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">
        What is the daily study reminder?
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        A browser push notification sent once a day to remind you to study. To enable it, go to
        <a href="/my-profile" class="underline">Profile</a> → Notifications → Daily study reminder. Your
        browser will ask for permission the first time.
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">
        I enabled the reminder but nothing arrives. Why?
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Check that your browser is allowed to send notifications in your OS settings (System
        Settings → Notifications). On iPhone, notifications only work if you have added Norskeord to
        your home screen first (Share → Add to Home Screen).
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">
        What are Norwegian lesson emails?
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Biweekly emails with a short Norwegian text, a vocabulary list, and exercises — matched to
        your level. Available to Plus members. Enable it under
        <a href="/my-profile" class="underline">Profile</a> → Notifications.
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">
        My progress isn't showing on my other device.
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Progress syncs across devices for Plus members. Free accounts store progress on the current
        device only. <a href="/plus" class="underline">Upgrade to Plus →</a>
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">Can I use Norskeord offline?</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Yes. Install it as an app (Share → Add to Home Screen on iPhone, or the install prompt in
        Chrome) and flashcard decks you have opened before will work without an internet connection.
        Ratings are saved locally and sync when you reconnect.
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">
        What is the difference between Free and Plus?
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Free gives you all A1 and A2 vocabulary plus a preview of B1/B2. Plus unlocks all levels
        (B1–C2), smart Due today scheduling, cross-device sync, quiz mode, and lesson emails.
        <a href="/plus" class="underline">See the full comparison →</a>
      </p>
    </div>
  </div>
</div>
