import type { SVGAttributes } from 'svelte/elements';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type PartOfSpeech =
	| 'noun'
	| 'verb'
	| 'adjective'
	| 'adverb'
	| 'pronoun'
	| 'preposition'
	| 'conjunction'
	| 'interjection'
	| 'phrase';

export const CATEGORIES_BY_LEVEL = {
	A1: [
		'greetings',
		'numbers',
		'colors',
		'family',
		'body',
		'food',
		'animals',
		'home',
		'days-months',
		'classroom',
		'basic-adjectives',
		'basic-verbs',
		'pronouns-and-questions',
		'feelings',
		'weather',
		'transportation'
	],
	A2: [
		'shopping',
		'transport',
		'clothing',
		'hobbies',
		'directions',
		'occupations',
		'sports',
		'health-basic',
		'weather',
		'time',
		'descriptive-adjectives',
		'cooking',
		'nature',
		'house-chores',
		'communication'
	],
	B1: [
		'travel',
		'environment',
		'media',
		'culture',
		'technology',
		'relationships',
		'education',
		'work',
		'city-life',
		'traditions',
		'opinion-adjectives',
		'food-cooking-advanced',
		'housing-renting',
		'health-body-intermediate',
		'finance-banking'
	],
	B2: [
		'politics',
		'economics',
		'social-issues',
		'arts',
		'science',
		'emotions',
		'idioms',
		'history',
		'law',
		'literature',
		'advanced-adjectives',
		'philosophy',
		'medicine',
		'psychology',
		'business',
		'religion'
	],
	C1: [
		'philosophy',
		'academic',
		'formal-writing',
		'rhetoric',
		'complex-emotions',
		'professional',
		'abstract-concepts',
		'politics-democracy',
		'linguistics',
		'media-journalism',
		'architecture-design',
		'diplomacy-international',
		'finance-economics',
		'medicine-healthcare',
		'psychology-advanced'
	],
	C2: [
		'literary',
		'archaic',
		'proverbs',
		'highly-formal',
		'technical',
		'nuanced-distinctions',
		'advanced-law-justice',
		'neuroscience-cognition',
		'climate-environment-policy',
		'sociology-anthropology',
		'advanced-business-strategy',
		'existential-abstract'
	]
} as const;

export type Category = (typeof CATEGORIES_BY_LEVEL)[CEFRLevel][number];

export interface VocabEntry {
	norsk: string;
	english: string;
	example: string;
	example_english?: string;
	level: CEFRLevel;
	category: Category;
	part: PartOfSpeech;
}

type TitleType = {
	id?: string;
	title?: string;
};

type DescType = {
	id?: string;
	desc?: string;
};

export interface BaseProps extends SVGAttributes<SVGElement> {
	size?: string;
	role?: string;
	color?: string;
	variation?: 'solid' | 'outline' | 'mini' | 'micro';
	strokeWidth?: string;
}

export interface Props extends BaseProps {
	title?: TitleType;
	desc?: DescType;
	ariaLabel?: string;
}
