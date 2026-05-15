<!--
  ActivityChart.svelte
  26-week rolling 7-day activity grid + streak badge.
  Works for both free users (localStorage) and Plus users (Supabase study_days).
-->
<script lang="ts">
  import type { ActivityCell } from '$lib/progress';
  import { SvelteMap, SvelteDate } from 'svelte/reactivity';

  interface Props {
    cells: ActivityCell[]; // from buildActivityGrid()
    streak: number; // current consecutive-day streak
    loading?: boolean;
  }

  let { cells, streak, loading = false }: Props = $props();

  const ROW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  interface GridColumn {
    cells: (ActivityCell | null)[];
    weekLabel: string; // e.g. "May 12"
  }

  // $derived takes an expression directly — not a function wrapper
  const grid: GridColumn[] = $derived(buildGrid(cells));

  function buildGrid(inputCells: ActivityCell[]): GridColumn[] {
    if (!inputCells.length) return [];

    const buckets = new SvelteMap<string, ActivityCell>();
    for (const cell of inputCells) {
      buckets.set(cell.date, cell);
    }

    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);

    // Step back to the Monday of today's week
    const dayOfWeek = today.getDay() || 7; // Sun=0 → 7
    const startOfThisWeek = new SvelteDate(today);
    startOfThisWeek.setDate(today.getDate() - (dayOfWeek - 1));

    // Walk back 26 weeks from start of this week
    const startDate = new SvelteDate(startOfThisWeek);
    startDate.setDate(startOfThisWeek.getDate() - 25 * 7);

    const columns: GridColumn[] = [];
    const cursor = new SvelteDate(startDate);

    while (cursor <= today) {
      const mondayDate = new SvelteDate(cursor);
      const col: GridColumn = {
        cells: Array(7).fill(null) as (ActivityCell | null)[],
        weekLabel: mondayDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      };

      for (let offset = 0; offset < 7; offset++) {
        const d = new SvelteDate(cursor);
        d.setDate(cursor.getDate() + offset);
        if (d > today) break;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const wd = d.getDay(); // 0=Sun…6=Sat
        const weekday = wd === 0 ? 7 : wd; // normalise Sun to 7
        col.cells[offset] = buckets.get(dateStr) ?? {
          date: dateStr,
          count: 0,
          level: 0,
          weekday: weekday as ActivityCell['weekday']
        };
      }
      columns.push(col);
      cursor.setDate(cursor.getDate() + 7);
    }

    return columns;
  }

  interface MonthLabel {
    colIndex: number;
    label: string;
  }

  const monthLabels: MonthLabel[] = $derived(buildMonthLabels(grid));

  function buildMonthLabels(cols: GridColumn[]): MonthLabel[] {
    const labels: MonthLabel[] = [];
    let lastMonth = -1;
    cols.forEach((col, i) => {
      const firstCell = col.cells.find((c) => c !== null);
      if (!firstCell) return;
      const month = new Date(firstCell.date + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({
          colIndex: i,
          label: new Date(firstCell.date + 'T00:00:00').toLocaleDateString('en-GB', {
            month: 'short'
          })
        });
        lastMonth = month;
      }
    });
    return labels;
  }

  const LEVEL_CLASSES = [
    'fill-gray-100 dark:fill-gray-700', // 0 — no activity
    'fill-green-200 dark:fill-green-900', // 1 — 1–5
    'fill-green-400 dark:fill-green-700', // 2 — 6–15
    'fill-green-600 dark:fill-green-500', // 3 — 16–30
    'fill-green-800 dark:fill-green-300' // 4 — 30+
  ];

  let tooltip = $state<{ text: string; x: number; y: number } | null>(null);

  function showTooltip(cell: ActivityCell, event: MouseEvent) {
    const d = new Date(cell.date + 'T00:00:00');
    const dateLabel = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    const cardLabel =
      cell.count === 0 ? 'No cards' : `${cell.count} card${cell.count === 1 ? '' : 's'}`;
    tooltip = { text: `${cardLabel} · ${dateLabel}`, x: event.offsetX, y: event.offsetY };
  }

  function hideTooltip() {
    tooltip = null;
  }

  const CELL_SIZE = 14;
  const CELL_GAP = 3;
  const STEP = CELL_SIZE + CELL_GAP;
  const ROW_LABEL_WIDTH = 28;
  const TOP_LABEL_HEIGHT = 18;
  const NUM_ROWS = 7;

  const viewBoxWidth: number = $derived(ROW_LABEL_WIDTH + grid.length * STEP);
  const viewBoxHeight: number = $derived(TOP_LABEL_HEIGHT + NUM_ROWS * STEP);
  const svgHeight: number = $derived(viewBoxHeight);
</script>

<div class="space-y-2">
  <!-- Streak badge -->
  <div class="flex items-center gap-2">
    {#if streak > 0}
      <span class="text-base font-semibold text-gray-700 dark:text-gray-300">
        🔥 {streak} day{streak === 1 ? '' : 's'}
      </span>
    {:else}
      <span class="text-sm text-gray-400 dark:text-gray-500">No current streak</span>
    {/if}
  </div>

  {#if loading}
    <div class="h-20 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
  {:else if grid.length === 0}
    <p class="text-xs text-gray-400 dark:text-gray-500">
      Study some cards to see your activity here.
    </p>
  {:else}
    <div class="relative overflow-x-auto">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <svg
        viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
        width="100%"
        height={svgHeight}
        preserveAspectRatio="xMinYMid meet"
        onmouseleave={hideTooltip}
        class="block"
        role="img"
        aria-label="Study activity chart"
      >
        <!-- Month labels -->
        {#each monthLabels as { colIndex, label } (label + colIndex)}
          <text
            x={ROW_LABEL_WIDTH + colIndex * STEP}
            y={TOP_LABEL_HEIGHT - 5}
            class="fill-gray-400 dark:fill-gray-500"
            font-size="10">{label}</text
          >
        {/each}

        <!-- Row labels (Mon–Sun) -->
        {#each ROW_LABELS as rowLabel, rowIdx (rowLabel)}
          <text
            x={0}
            y={TOP_LABEL_HEIGHT + rowIdx * STEP + CELL_SIZE - 1}
            class="fill-gray-400 dark:fill-gray-500"
            font-size="10">{rowLabel}</text
          >
        {/each}

        <!-- Cells -->
        {#each grid as col, colIdx (col.weekLabel + colIdx)}
          {#each col.cells as cell, rowIdx (rowIdx)}
            {#if cell !== null}
              <!-- svelte-ignore a11y_mouse_events_have_key_events -->
              <rect
                x={ROW_LABEL_WIDTH + colIdx * STEP}
                y={TOP_LABEL_HEIGHT + rowIdx * STEP}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx="2"
                class="{LEVEL_CLASSES[cell.level]} cursor-default"
                onmouseover={(e) => showTooltip(cell, e)}
              />
            {/if}
          {/each}
        {/each}
      </svg>

      {#if tooltip}
        <div
          class="pointer-events-none absolute z-10 rounded bg-gray-800 px-2 py-1 text-xs text-white shadow dark:bg-gray-200 dark:text-gray-900"
          style="left: {tooltip.x + 12}px; top: {tooltip.y - 8}px; white-space: nowrap"
        >
          {tooltip.text}
        </div>
      {/if}
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
      <span>Less</span>
      {#each LEVEL_CLASSES as cls (cls)}
        <svg width="14" height="14"><rect width="14" height="14" rx="2" class={cls} /></svg>
      {/each}
      <span>More</span>
    </div>
  {/if}
</div>
