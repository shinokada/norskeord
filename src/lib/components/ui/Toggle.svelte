<script lang="ts">
  let {
    checked = $bindable(),
    label,
    name,
    value = 'true',
    hint,
    onchange
  }: {
    checked: boolean;
    label: string;
    name: string;
    value?: string;
    hint?: string;
    onchange?: () => void;
  } = $props();
</script>

<div>
  <label class="flex cursor-pointer items-center justify-between gap-4 py-0.5">
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    <!-- Hidden checkbox submitted with the form -->
    <input type="checkbox" {name} {value} bind:checked {onchange} class="sr-only" />
    <!-- Visual toggle track -->
    <span
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
        {checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}"
      aria-hidden="true"
    >
      <!-- Thumb -->
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
          {checked ? 'translate-x-6' : 'translate-x-1'}"
      ></span>
    </span>
  </label>
  {#if hint}
    <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">{hint}</p>
  {/if}
</div>
