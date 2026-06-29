<script lang="ts">
  /**
   * SegmentedControl.svelte
   *
   * A tap-friendly segmented button group for selecting one option from a
   * small set (2–4 options). Renders a hidden <input type="radio"> per option
   * so the value is submitted naturally with the parent <form>.
   *
   * Usage:
   *   <SegmentedControl
   *     name="card_type"
   *     options={[{ value: 'word', label: 'Word' }, { value: 'phrase', label: 'Phrase' }]}
   *     bind:selected={cardType}
   *   />
   */

  let {
    name,
    options,
    selected = $bindable(),
    hint,
    label
  }: {
    name: string;
    options: { value: string; label: string }[];
    selected: string;
    hint?: string;
    label?: string;
  } = $props();
</script>

<div>
  {#if label}
    <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
  {/if}

  <div
    class="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-white/10 dark:bg-indigo-900/30"
    role="group"
  >
    {#each options as opt (opt.value)}
      <!-- Hidden radio submitted with the form -->
      <input
        type="radio"
        id="{name}-{opt.value}"
        {name}
        value={opt.value}
        checked={selected === opt.value}
        onchange={() => (selected = opt.value)}
        class="sr-only"
      />
      <label
        for="{name}-{opt.value}"
        class="cursor-pointer select-none rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150
          {selected === opt.value
          ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white'
          : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}"
      >
        {opt.label}
      </label>
    {/each}
  </div>

  {#if hint}
    <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">{hint}</p>
  {/if}
</div>
