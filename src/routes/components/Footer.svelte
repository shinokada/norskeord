<script module lang="ts">
  declare const __VERSION__: string;
</script>

<script lang="ts">
  import { Footer, FooterBrand } from 'flowbite-svelte';
</script>

<Footer class="shadow-none dark:bg-blue-950" footerType="logo">
  <div class="sm:flex sm:items-center sm:justify-between">
    <FooterBrand href="https://norskeord.no" name="Norskeord" />
    <p class="mt-2 text-xs text-gray-400 sm:mt-0 dark:text-gray-500">v{__VERSION__}</p>
  </div>
</Footer>
