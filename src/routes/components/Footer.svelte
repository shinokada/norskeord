<script lang="ts">
  import { Footer, FooterBrand } from 'flowbite-svelte';

  declare const __VERSION__: string;
</script>

<Footer class="shadow-none dark:bg-blue-950" footerType="logo">
  <div class="sm:flex sm:items-center sm:justify-between">
    <FooterBrand href="https://norskeord.no" name="Norskeord" />
    <p class="mt-2 text-xs text-gray-400 dark:text-gray-500 sm:mt-0">v{__VERSION__}</p>
  </div>
</Footer>
