<script lang="ts">
  import { Badge, Button, Card } from 'flowbite-svelte';
  import { CheckOutline, CloseOutline, EditOutline } from 'flowbite-svelte-icons';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const levelLabel: Record<string, string> = { A: 'A1/A2', B: 'B1/B2' };

  type VocabItem = { norsk: string; english: string; example: string };
  type Exercise = { type: string; prompt: string; options?: string[]; answer: string };

  let editingId = $state<string | null>(null);
  let draftLessonDate = $state('');
  let draftFocusTopic = $state('');
  let draftMainText = $state('');
  let draftVocabulary = $state('');
  let draftExercises = $state('');
  let jsonError = $state('');

  function startEdit(lesson: (typeof data.lessons)[0]) {
    editingId = lesson.id;
    draftLessonDate = lesson.lesson_date;
    draftFocusTopic = lesson.focus_topic;
    draftMainText = lesson.main_text;
    draftVocabulary = JSON.stringify(lesson.vocabulary, null, 2);
    draftExercises = JSON.stringify(lesson.exercises, null, 2);
    jsonError = '';
  }

  function cancelEdit() {
    editingId = null;
    jsonError = '';
  }

  function validateJson() {
    try {
      JSON.parse(draftVocabulary);
      JSON.parse(draftExercises);
      jsonError = '';
      return true;
    } catch (e) {
      jsonError = (e as Error).message;
      return false;
    }
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10">
  <h1 class="mb-2">Lesson Review</h1>
  <p class="mb-8 text-sm text-gray-600 dark:text-gray-300">
    {data.lessons.filter((l) => !l.approved).length} pending ·
    {data.lessons.filter((l) => l.approved).length} approved
  </p>

  {#if data.lessons.length === 0}
    <p class="text-gray-500">No lessons generated yet. Run <code>pnpm generate:lessons</code>.</p>
  {/if}

  {#each data.lessons as lesson (lesson.id)}
    <Card class="mb-6 w-full max-w-none">
      <!-- Header row -->
      <div class="mb-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold dark:text-white">{lesson.lesson_date}</span>
          <Badge color="indigo">{levelLabel[lesson.level_group] ?? lesson.level_group}</Badge>
          {#if lesson.approved}
            <Badge color="green">✓ Approved</Badge>
          {:else}
            <Badge color="yellow">Pending</Badge>
          {/if}
        </div>

        <div class="flex gap-2">
          {#if editingId !== lesson.id}
            <Button size="xs" color="alternative" onclick={() => startEdit(lesson)}>
              <EditOutline class="me-1 h-3 w-3" /> Edit
            </Button>
          {/if}
          {#if !lesson.approved && editingId !== lesson.id}
            <form method="POST" action="?/approve" use:enhance>
              <input type="hidden" name="id" value={lesson.id} />
              <Button type="submit" size="xs" color="green">
                <CheckOutline class="me-1 h-3 w-3" /> Approve
              </Button>
            </form>
            <form method="POST" action="?/reject" use:enhance>
              <input type="hidden" name="id" value={lesson.id} />
              <Button type="submit" size="xs" color="red">
                <CloseOutline class="me-1 h-3 w-3" /> Delete
              </Button>
            </form>
          {/if}
        </div>
      </div>

      {#if editingId === lesson.id}
        <!-- ── Edit mode ── -->
        <form
          method="POST"
          action="?/update"
          use:enhance={() => {
            if (!validateJson()) return () => {};
            return ({ update }) => update();
          }}
          onsubmit={(e) => {
            if (!validateJson()) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="level_group" value={lesson.level_group} />
          <input type="hidden" name="vocabulary" value={draftVocabulary} />
          <input type="hidden" name="exercises" value={draftExercises} />

          <div class="mb-3">
            <label
              for="date-{lesson.id}"
              class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Send date
            </label>
            <input
              id="date-{lesson.id}"
              type="date"
              name="lesson_date"
              bind:value={draftLessonDate}
              class="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="mb-3">
            <label
              for="focus-{lesson.id}"
              class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Focus topic
            </label>
            <input
              id="focus-{lesson.id}"
              type="text"
              name="focus_topic"
              bind:value={draftFocusTopic}
              class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="mb-3">
            <label
              for="main-{lesson.id}"
              class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Main text
            </label>
            <textarea
              id="main-{lesson.id}"
              name="main_text"
              rows="5"
              bind:value={draftMainText}
              class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>

          <div class="mb-3">
            <label
              for="vocab-{lesson.id}"
              class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Vocabulary (JSON)
            </label>
            <textarea
              id="vocab-{lesson.id}"
              rows="10"
              bind:value={draftVocabulary}
              oninput={() => (jsonError = '')}
              class="w-full rounded border border-gray-300 px-3 py-1.5 font-mono text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>

          <div class="mb-3">
            <label
              for="ex-{lesson.id}"
              class="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Exercises (JSON)
            </label>
            <textarea
              id="ex-{lesson.id}"
              rows="10"
              bind:value={draftExercises}
              oninput={() => (jsonError = '')}
              class="w-full rounded border border-gray-300 px-3 py-1.5 font-mono text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>

          {#if jsonError}
            <p class="mb-2 text-xs text-red-600 dark:text-red-400">JSON error: {jsonError}</p>
          {/if}

          <div class="flex gap-2">
            <Button type="submit" size="xs" color="primary">Save changes</Button>
            <Button type="button" size="xs" color="alternative" onclick={cancelEdit}>Cancel</Button>
          </div>
        </form>
      {:else}
        <!-- ── Read mode ── -->
        <p class="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
          Focus: {lesson.focus_topic}
        </p>

        <div class="border-primary-500 mb-4 rounded border-l-4 bg-gray-50 p-3 dark:bg-gray-700">
          <p class="text-sm leading-relaxed dark:text-gray-200">{lesson.main_text}</p>
        </div>

        <details class="mb-3">
          <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Vocabulary ({lesson.vocabulary?.length ?? 0} items)
          </summary>
          <div class="mt-2 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-600 dark:text-gray-300">
                  <th class="pr-4 pb-1">Norsk</th>
                  <th class="pr-4 pb-1">English</th>
                  <th class="pb-1">Example</th>
                </tr>
              </thead>
              <tbody>
                {#each (lesson.vocabulary as VocabItem[]) ?? [] as v (v.norsk)}
                  <tr class="border-t border-gray-100 dark:border-gray-600">
                    <td class="py-1 pr-4 font-medium dark:text-white">{v.norsk}</td>
                    <td class="py-1 pr-4 text-gray-600 dark:text-gray-300">{v.english}</td>
                    <td class="py-1 text-gray-500 italic dark:text-gray-400">{v.example}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </details>

        <details>
          <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Exercises ({lesson.exercises?.length ?? 0})
          </summary>
          <div class="mt-2 space-y-2">
            {#each (lesson.exercises as Exercise[]) ?? [] as ex, i (i)}
              <div class="rounded bg-gray-50 p-2 text-sm dark:bg-gray-700">
                <span class="font-medium dark:text-white">{i + 1}. [{ex.type}]</span>
                <span class="ml-1 dark:text-gray-200">{ex.prompt}</span>
                {#if ex.options}
                  <ul class="mt-1 ml-4 list-disc text-gray-600 dark:text-gray-300">
                    {#each ex.options as opt (opt)}
                      <li>{opt}</li>
                    {/each}
                  </ul>
                {/if}
                <p class="mt-1 text-green-700 dark:text-green-400">→ {ex.answer}</p>
              </div>
            {/each}
          </div>
        </details>
      {/if}
    </Card>
  {/each}
</div>
