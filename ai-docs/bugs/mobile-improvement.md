# Mobile improvements for norskeord

## High impact (flashcard UX — the core mobile experience)

**1. Rating buttons are too small on mobile**
The 4 rating buttons (`Again / Hard / Good / Easy`) use `grid-cols-2` on mobile, which is good, but the buttons are `py-3` with small text. On iOS/Android the touch targets are marginal. Bigger issue: on mobile the interval label (`in 3 days`) is a second line inside the button — fine on desktop, but it causes uneven heights in the 2×2 grid. Consider making them `min-h-[56px]` and moving the interval label _below_ each button rather than inside it.

**2. The mode segmented controls wrap awkwardly**
`Norsk → English` / `English → Norsk` / `Definition` are three wide buttons in one row. On a 375px screen they overflow. You already have `flex-wrap` on the outer container, but the buttons themselves don't break gracefully because they're inside a single `inline-flex` with a shared border. On very small screens the definition button gets clipped. A practical fix: hide the text abbreviation (`EN` instead of `English`) under `xs:` breakpoint, or stack mode + card-type controls vertically on small screens.

**3. Flashcard card takes up only 50% width on md+ screens**
The `.flip-box` has `md:w-1/2` — fine. But on mobile it's full width with no horizontal padding from the card itself, meaning the card bleeds to the very edge of the viewport. Add at least `px-2` to the `.flip-box` wrapper on mobile so the card doesn't touch the screen edge, which also avoids accidental back/forward browser gestures on iOS.

**4. Example section layout on mobile**
The example sentence box (`rounded-lg bg-gray-50 px-5 py-4`) with the show/hide translation toggle stacks fine vertically, but on a phone you end up with a lot of scrolling: card → rating buttons → POS badge + speak + undo → example box → nav buttons. This is 6 separate interactive zones. Consider collapsing the POS badge + speak button into the hint bar row (where the card counter already lives), saving one full-width row.

---

## Medium impact (navigation & layout)

**5. Sidebar is full-screen width on mobile**
`class="... w-full"` on the Sidebar means it covers the entire screen. This is intentional, but the `SidebarButton` (hamburger) only closes it — there's no swipe-to-dismiss. You handle the horizontal pan prevention in `+layout.svelte` with `touchmove`, which is correct for the flashcard, but that same handler fires while the sidebar is open, meaning a left swipe to close the sidebar is blocked. You should gate the pan prevention on sidebar-open state: `if (dx > dy && !isDemoOpen) e.preventDefault()`.

**6. Nav bar has duplicate DarkMode + SidebarButton on mobile**
On small screens, the right side of the Navbar contains: search (if Plus) → language flag → [possibly] Plus CTA → avatar → undo dot → DarkMode → SidebarButton. That's potentially 5+ icons in a row on a 375px screen, competing with the "Norskeord" brand text. The Plus CTA (`sm:inline-block`) shows from 640px — that's fine — but the avatar with the dropdown is `hidden md:block` while DarkMode and SidebarButton always show. Check on a 360px device that the brand text isn't truncated.

**7. Footer grid: `grid-cols-2 sm:grid-cols-5`**
On 375px, the footer is 2 columns — Brand + Level, then Learn / Account / Help stacking. This looks okay but the brand column is `col-span-2 sm:col-span-1`, which means on mobile the brand occupies the full width as a row of its own, which is wasted space. Consider `col-span-2 sm:col-span-1` only if the brand block actually needs full width; otherwise a compact single-column stacked footer would be cleaner on mobile.

---

## Lower impact / polish

**8. Home page hero padding**
`py-10 sm:py-20` with `mt-4 sm:mt-8` is good. But the decorative blur blobs (`-top-20 -left-20`, `-right-16 bottom-0`) can trigger horizontal overflow on small screens even with `overflow-hidden` on the parent — verify `overflow-x: hidden` is on the hero div itself (it's only on `html, body` in `app.css`). The hero div already has `overflow-hidden` so this is fine, but worth confirming in DevTools at 360px.

**9. Home page feature/level cards: `grid-cols-1 → sm:grid-cols-2`**
Good. No issue here — single column on mobile is the right call for these card-heavy sections.

**10. PWA `start_url` and `display: standalone`**
You have `display: 'standalone'` and `start_url: '/'`. Since the iOS PWA cookie isolation bug is already fixed (OTP login), this is good. But consider `start_url: '/learn/a1'` or using the `last-flashcard-path` localStorage value — users who add the app to their homescreen almost certainly want to land in the flashcard, not on the marketing homepage.

**11. `data-sveltekit-preload-data="tap"`**
Using `tap` rather than the default `hover` is the right choice for mobile (hover has no meaning on touch). No change needed.

**12. Touch swipe threshold is 30px**
In `handleTouchEnd`, `dx < -30` / `dx > 30` is a tight threshold — fine for deliberate swipes but may accidentally fire when a user taps slightly diagonally. Consider raising to 50px and adding a velocity check, or just leaving it since the flip-box also handles taps for card reveal and the two gestures (horizontal swipe vs vertical tap) are distinct enough in practice.

---

## Quick wins summary

The three things with the best effort-to-impact ratio:

1. **Rating buttons**: increase to `min-h-[56px]`, move interval label outside the button box.
2. **Sidebar pan block**: gate the `touchmove` `e.preventDefault()` on `!isDemoOpen` so swipe-to-dismiss works.
3. **Mode segmented controls**: abbreviate language names on small screens (`EN` / `NO` or use flags) so they don't overflow on 360px devices.

The rest of the UX is already quite well built for mobile — touch events, min-44px targets on nav links, `pointer: coarse` detection, `data-sveltekit-preload-data="tap"`, PWA manifest, and the swipe-to-navigate on flashcards are all in good shape.
