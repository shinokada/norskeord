<script module lang="ts">
  declare const __VERSION__: string;
</script>

<footer class="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-blue-950">
  <div class="mx-auto max-w-4xl px-4">
    <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
      <!-- Brand -->
      <div class="col-span-2 sm:col-span-1">
        <a href="/" class="text-base font-bold text-gray-900 dark:text-white">Norskeord</a>
        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Norwegian vocabulary from A1 to C
        </p>
        <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">v{__VERSION__}</p>
      </div>

      <!-- Learn -->
      <div>
        <p
          class="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
        >
          Learn
        </p>
        <ul class="space-y-2">
          <li>
            <a
              href="/learn/a1"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >A1</a
            >
          </li>
          <li>
            <a
              href="/learn/a2"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >A2</a
            >
          </li>
          <li>
            <a
              href="/learn/b1"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >B1</a
            >
          </li>
          <li>
            <a
              href="/learn/b2"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >B2</a
            >
          </li>
          <li>
            <a
              href="/learn/c"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >C</a
            >
          </li>
          <li>
            <a
              href="/grammar"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >Grammar</a
            >
          </li>
          <li>
            <a
              href="/quiz"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >Quiz</a
            >
          </li>
          <li>
            <a
              href="/norskproven"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >Norskprøven</a
            >
          </li>
        </ul>
      </div>

      <!-- Resources -->
      <div>
        <p
          class="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
        >
          Resources
        </p>
        <ul class="space-y-2">
          <li>
            <a
              href="/blog"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >Blog</a
            >
          </li>
          <li>
            <a
              href="/stats"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >My stats</a
            >
          </li>
          <li>
            <a
              href="/plus"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >Plus</a
            >
          </li>
          <li>
            <a
              href="/about"
              class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >About</a
            >
          </li>
        </ul>
      </div>
    </div>

    <p class="mt-8 text-xs text-gray-400 dark:text-gray-600">
      © {new Date().getFullYear()} Norskeord
    </p>
  </div>
</footer>
