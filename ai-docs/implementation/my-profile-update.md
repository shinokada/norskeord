# My Profile Page — Mobile-First Modernisation

## Goals

Make the `/my-profile` page feel like a modern mobile settings screen without
changing any backend behaviour. Three focused improvements, in priority order:

1. **Toggle switches** — replace binary radio buttons and the checkbox with styled toggles
2. **Auto-save per section** with a toast — remove the explicit Save button; save on change
3. **Collapse Danger Zone** — hide behind a `<details>` disclosure to shorten the page

---

## 1. Toggle Switches

### What changes

Replace these controls in `PreferencesSection.svelte` with toggle switches:

| Setting | Current control | New control |
|---|---|---|
| Card direction (2-option only) | Radio group | Toggle (Norsk→L2 / L2→Norsk) |
| Card type (Word / Phrase) | Radio group | Toggle |
| Show example translation | Checkbox | Toggle |

> **Note:** Card direction has a third option (`def_l1`) for B1+ word mode.
> When that third option is available, keep it as a compact segmented control
> (3 labelled buttons), not a toggle. Toggles only make sense for binary choices.

### Implementation

Create `src/lib/components/ui/Toggle.svelte`:

```svelte
<script lang="ts">
  let { checked = $bindable(), label, name, value = 'true' }: {
    checked: boolean;
    label: string;
    name: string;
    value?: string;
  } = $props();
</script>

<label class="flex cursor-pointer items-center justify-between gap-4 py-1">
  <span class="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  <input type="checkbox" {name} {value} bind:checked class="sr-only" />
  <span
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      {checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        {checked ? 'translate-x-6' : 'translate-x-1'}"
    ></span>
  </span>
</label>
```

For the binary card-direction and card-type toggles, use a two-button segmented
control instead of raw radio inputs:

```svelte
<!-- SegmentedControl.svelte -->
<!-- Props: options: {value, label}[], bind:selected -->
```

This gives a tap-friendly target size (min 44px height) and avoids the tiny
radio dot that's hard to hit on mobile.

### Files changed
- `src/lib/components/ui/Toggle.svelte` — new component
- `src/lib/components/ui/SegmentedControl.svelte` — new component
- `src/routes/my-profile/PreferencesSection.svelte` — swap controls

---

## 2. Auto-Save Per Section with Toast

### What changes

- Remove the explicit **Save changes** button from `PreferencesSection.svelte`
  and `AccountSection.svelte`
- Save automatically when any field changes (debounced 600 ms for text inputs,
  immediate for selects/toggles)
- Show a brief **toast notification** (bottom of screen, auto-dismisses after
  2 s) confirming the save

### Why debounce

The display name is a text input. Saving on every keystroke would hammer the
API. 600 ms after the last keystroke is the standard pattern.

### Toast component

Create `src/lib/components/ui/Toast.svelte`:

```svelte
<!-- Renders at the bottom of the viewport via a Svelte portal/teleport -->
<!-- Props: message, visible -->
<!-- Auto-dismisses after 2000 ms -->
<!-- Slide-up animation on appear, fade out on dismiss -->
```

Add a `toastStore` (simple `$state` object or a tiny svelte store) so any
section can trigger it.

### Save trigger per control type

| Control | Trigger |
|---|---|
| Select (`<select>`) | `onchange` |
| Toggle | `onchange` |
| Segmented control | on segment click |
| Text input (display name) | `oninput` + 600 ms debounce |

Each change calls the existing `?/updatePreferences` (or `?/updateAccount`)
form action via `fetch` directly (no `<form>` submit), then shows the toast.

### Error handling

If the save fails, show the toast in red with the error message. No change to
current error state logic.

### Files changed
- `src/lib/components/ui/Toast.svelte` — new component
- `src/lib/stores/toast.svelte.ts` — new tiny store
- `src/routes/my-profile/PreferencesSection.svelte` — remove Save button, add auto-save
- `src/routes/my-profile/AccountSection.svelte` — same for display name field

---

## 3. Collapse Danger Zone

### What changes

Wrap the `DangerZone` card in a native `<details>`/`<summary>` element so it
is collapsed by default and doesn't occupy visible real estate on page load.

### Implementation

In `+page.svelte`, replace:

```svelte
<DangerZone />
```

with:

```svelte
<details class="group">
  <summary class="cursor-pointer list-none">
    <span class="text-sm font-medium text-red-500 hover:text-red-400">
      ▸ Danger Zone
    </span>
  </summary>
  <div class="mt-3">
    <DangerZone />
  </div>
</details>
```

Use CSS `group-open` (Tailwind) to rotate the arrow when open.

No changes needed inside `DangerZone.svelte` itself.

### Files changed
- `src/routes/my-profile/+page.svelte` — wrap DangerZone in `<details>`

---

## Implementation Order

1. ✅ **Toggle + SegmentedControl components** (no behaviour change, purely visual)
2. ✅ **Swap controls in PreferencesSection** (validate everything still submits correctly)
3. ✅ **Toast store + component**
4. ✅ **Auto-save in PreferencesSection** (biggest change — test all fields)
5. ✅ **Auto-save in AccountSection** (display name only)
6. ✅ **Collapse Danger Zone** (one-liner in page, lowest risk)

---

## Out of Scope

- Sidebar layout (desktop only pattern, not mobile-first)
- Avatar upload
- Progress snapshot in hero
- i18n for new component labels (add later via existing paraglide workflow)
