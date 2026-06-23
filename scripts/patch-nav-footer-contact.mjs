#!/usr/bin/env node
/**
 * patch-nav-footer-contact.mjs
 *
 * Adds "Contact" to:
 *   - Nav.svelte  : Help dropdown (desktop) + mobile sidebar
 *   - Footer.svelte : resourcesPages array
 *
 * Usage (from the norskeord project root):
 *   node scripts/patch-nav-footer-contact.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function patch(relPath, replacements) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Not found: ${filePath}`);
    process.exit(1);
  }
  let src = fs.readFileSync(filePath, 'utf-8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (!src.includes(from)) {
      console.error(`✗ Could not find expected string in ${relPath}:\n  ${from.slice(0, 80)}…`);
      process.exit(1);
    }
    src = src.replace(from, to);
    count++;
  }
  fs.writeFileSync(filePath, src, 'utf-8');
  console.log(`✓ ${relPath}  (${count} replacement${count !== 1 ? 's' : ''})`);
}

// ── Nav.svelte ────────────────────────────────────────────────────────────────

patch('src/routes/components/Nav.svelte', [
  // 1. Add EnvelopeOutline to icon imports
  [
    `    ArrowLeftToBracketOutline,
    GlobeOutline
  } from 'flowbite-svelte-icons';`,
    `    ArrowLeftToBracketOutline,
    GlobeOutline,
    EnvelopeOutline
  } from 'flowbite-svelte-icons';`
  ],

  // 2. Add Contact item to the Help dropdown (after Free resources)
  [
    `      <DropdownItem class="dark:hover:bg-blue-900" href="/resources" onclick={closeMoreDropdown}
        >{m.nav_free_resources()}</DropdownItem
      >
    </Dropdown>`,
    `      <DropdownItem class="dark:hover:bg-blue-900" href="/resources" onclick={closeMoreDropdown}
        >{m.nav_free_resources()}</DropdownItem
      >
      <DropdownItem class="dark:hover:bg-blue-900" href="/contact" onclick={closeMoreDropdown}
        >{m.nav_contact()}</DropdownItem
      >
    </Dropdown>`
  ],

  // 3. Add Contact SidebarItem after Free resources in the mobile sidebar
  [
    `      <SidebarItem label={m.nav_free_resources()} href="/resources">
        {#snippet icon()}
          <FolderArrowRightOutline
            class="h-5 w-5 text-gray-600 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
    </SidebarGroup>
    {#if effectiveUser}`,
    `      <SidebarItem label={m.nav_free_resources()} href="/resources">
        {#snippet icon()}
          <FolderArrowRightOutline
            class="h-5 w-5 text-gray-600 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label={m.nav_contact()} href="/contact">
        {#snippet icon()}
          <EnvelopeOutline
            class="h-5 w-5 text-gray-600 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
    </SidebarGroup>
    {#if effectiveUser}`
  ]
]);

// ── Footer.svelte ─────────────────────────────────────────────────────────────

patch('src/routes/components/Footer.svelte', [
  [
    `    { name: () => m.nav_guide(), link: '/guide' }
  ];`,
    `    { name: () => m.nav_guide(), link: '/guide' },
    { name: () => m.footer_contact(), link: '/contact' }
  ];`
  ]
]);

console.log('\nDone. Run `pnpm check` to verify.');
