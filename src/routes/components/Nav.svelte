<script lang="ts">
	import {
		Navbar,
		NavLi,
		NavBrand,
		NavUl,
		NavHamburger,
		DarkMode,
		MegaMenu
	} from 'flowbite-svelte';
	import No from '$lib/No.svelte';
	import { page } from '$app/state';
	import { CATEGORIES_BY_LEVEL } from '$lib/types';
	import { removeHyphensAndCapitalize } from '$lib/utils';
	import ChevronDownOutline from './ChevronDownOutline.svelte';

	let activeUrl = $derived(page.url.pathname);
	let activeClass = 'p-2 text-base hover:text-gray-500';
	let nonActiveClass = 'p-2 text-base hover:text-gray-500';

	const linkClass =
		'flex items-center gap-1.5 py-1 text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';
	const badgeClass =
		'shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-gray-600 dark:text-gray-400';

	const aNiva = [
		...CATEGORIES_BY_LEVEL.A1.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/a1/${c}`,
			level: 'A1'
		})),
		...CATEGORIES_BY_LEVEL.A2.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/a2/${c}`,
			level: 'A2'
		}))
	];

	const bNiva = [
		...CATEGORIES_BY_LEVEL.B1.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/b1/${c}`,
			level: 'B1'
		})),
		...CATEGORIES_BY_LEVEL.B2.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/b2/${c}`,
			level: 'B2'
		}))
	];

	const cNiva = [
		...CATEGORIES_BY_LEVEL.C1.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/c1/${c}`,
			level: 'C1'
		})),
		...CATEGORIES_BY_LEVEL.C2.map((c) => ({
			name: removeHyphensAndCapitalize(c),
			href: `/c2/${c}`,
			level: 'C2'
		}))
	];
</script>

<Navbar
	breakpoint="lg"
	fluid
	class="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-blue-950"
	navContainerClass="lg:justify-between"
>
	<NavBrand href="/">
		<No size="40" class="inline" />
		<span class="ml-2 self-center text-xl font-semibold whitespace-nowrap dark:text-white"
			>Norske flashcard</span
		>
	</NavBrand>
	<div class="flex items-center lg:order-2">
		<DarkMode class="inline-block hover:text-gray-900 dark:hover:text-white" />
		<NavHamburger />
	</div>
	<NavUl
		breakpoint="lg"
		{activeUrl}
		class="order-2 lg:order-1"
		classes={{ active: activeClass, nonActive: nonActiveClass, ul: 'p-0' }}
	>
		<NavLi class="cursor-pointer">
			Nivå A <ChevronDownOutline size="sm" class="ms-1 inline" />
		</NavLi>
		<MegaMenu items={aNiva}>
			{#snippet children({ item })}
				<a href={item.href} class={linkClass}>
					<span class={badgeClass}>{item.level}</span>
					{item.name}
				</a>
			{/snippet}
		</MegaMenu>

		<NavLi class="cursor-pointer">
			Nivå B <ChevronDownOutline size="sm" class="ms-1 inline" />
		</NavLi>
		<MegaMenu items={bNiva}>
			{#snippet children({ item })}
				<a href={item.href} class={linkClass}>
					<span class={badgeClass}>{item.level}</span>
					{item.name}
				</a>
			{/snippet}
		</MegaMenu>

		<NavLi class="cursor-pointer">
			Nivå C <ChevronDownOutline size="sm" class="ms-1 inline" />
		</NavLi>
		<MegaMenu items={cNiva}>
			{#snippet children({ item })}
				<a href={item.href} class={linkClass}>
					<span class={badgeClass}>{item.level}</span>
					{item.name}
				</a>
			{/snippet}
		</MegaMenu>

		<NavLi href="/about">About</NavLi>
	</NavUl>
</Navbar>
