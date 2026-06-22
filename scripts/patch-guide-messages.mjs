#!/usr/bin/env node
// patch-guide-messages.mjs
// Run from the norskeord project root:
//   node scripts/patch-guide-messages.mjs
//
// Adds new guide_* keys for the updated /guide page to all four locale files.
// Existing keys are left untouched. Only the new keys listed below are inserted.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const messagesDir = join(root, 'messages');

// ─── NEW KEYS PER LOCALE ─────────────────────────────────────────────────────

const newKeys = {
  en: {
    // Anchor nav labels
    guide_anchor_start: 'Where to start',
    guide_anchor_flashcards: 'Flashcards',
    guide_anchor_quiz: 'Quiz',
    guide_anchor_grammar: 'Grammar',
    guide_anchor_norskproven: 'Norskprøven',
    guide_anchor_faq: 'FAQ',

    // Where to start section
    guide_start_heading: 'Where to start',
    guide_start_intro:
      "Norskeord has four learning modes. Here's a quick guide to which one fits your goal right now:",
    guide_start_path_beginner_label: 'New to Norwegian?',
    guide_start_path_beginner_desc:
      'Start with A1 flashcards — everyday words with audio on every card.',
    guide_start_path_beginner_cta: 'Browse A1 categories →',
    guide_start_path_exam_label: 'Preparing for Norskprøven?',
    guide_start_path_exam_desc:
      'Go straight to the exam prep section, organised by the topics that appear on the test.',
    guide_start_path_exam_cta: 'Norskprøven prep →',
    guide_start_path_quiz_label: 'Want to test yourself?',
    guide_start_path_quiz_desc: 'Quiz mode asks you to recall words actively, not just flip cards.',
    guide_start_path_quiz_cta: 'Try the quiz →',
    guide_start_path_grammar_label: 'Struggling with grammar?',
    guide_start_path_grammar_desc: 'Grammar practice covers word order, ikke-placement, and more.',
    guide_start_path_grammar_cta: 'Practise grammar →',
    guide_start_note:
      'All four modes update your review schedule — so your flashcards, quiz, and grammar practice share the same progress.',

    // Flashcards section heading (new wrapper heading)
    guide_flashcards_heading: 'Flashcards',
    guide_flashcards_intro:
      'Flashcards are the foundation of Norskeord. Every card has audio, and you can switch between Norwegian → English, English → Norwegian, or Definition → Norwegian (B1 and above). Rate each card after flipping to keep your review schedule accurate.',

    // Quiz section
    guide_quiz_heading: 'Quiz mode',
    guide_quiz_intro:
      'Quiz mode tests active recall — you have to produce or recognise an answer, not just flip a card. There are three question types:',
    guide_quiz_mc:
      'Multiple choice — pick the correct translation from four options. Press A B C D on keyboard.',
    guide_quiz_fill_label: 'Fill',
    guide_quiz_fill: 'Fill in the blank — complete a sentence with the missing Norwegian word.',
    guide_quiz_type_label: 'Type',
    guide_quiz_type: 'Typed answer — type the Norwegian word for an English prompt from memory.',
    guide_quiz_scheduling:
      'Every quiz answer updates your spaced-repetition schedule, the same way flashcard ratings do. Correct answers extend the next review interval; wrong answers bring the card back sooner.',
    guide_quiz_access:
      '<strong>Free:</strong> top 3 categories per level. <strong>Plus:</strong> all categories across all levels.',
    guide_quiz_access_cta: 'See Plus →',

    // Grammar section
    guide_grammar_heading: 'Grammar practice',
    guide_grammar_intro:
      'Grammar practice focuses on the structural rules of Norwegian that vocabulary alone cannot teach. Topics are organised by CEFR level and cover:',
    guide_grammar_type_fill: 'Fill in the blank — supply the correct form of a word in context.',
    guide_grammar_type_order:
      'Word order — arrange words into a grammatically correct Norwegian sentence.',
    guide_grammar_type_transform:
      'Transform — rewrite a sentence following a rule (e.g. negation, tense change).',
    guide_grammar_rule:
      'After each answer, you see the grammar rule that explains why — with an optional deeper read if you want the full explanation.',
    guide_grammar_access:
      '<strong>Free:</strong> 4 grammar topics. <strong>Plus:</strong> all topics including advanced sentence transformations.',
    guide_grammar_access_cta: 'See Plus →',

    // Norskprøven section
    guide_norskproven_heading: 'Norskprøven preparation',
    guide_norskproven_what:
      'Norskprøven is the official Norwegian language exam — required for permanent residency and citizenship. Norskeord covers it in two ways: vocabulary decks focused on exam topics (under the Norskprøven menu), and full practice tests.',
    guide_norskproven_how:
      'Practice tests are exam-style tasks at A2 and B1 level, in three formats:',
    guide_norskproven_reading:
      'Reading — short passages with multiple-choice comprehension questions.',
    guide_norskproven_writing:
      'Writing — structured prompts with model answers so you can compare your response.',
    guide_norskproven_oral:
      'Oral — role-play scenarios and discussion questions with a built-in 2-minute preparation timer.',
    guide_norskproven_access:
      '<strong>Free:</strong> Practice Test 1 at A2 and B1. <strong>Plus:</strong> all practice tests.',
    guide_norskproven_access_cta: 'See Plus →',

    // Flashcard language section
    guide_lang_heading: 'Flashcard language vs interface language',
    guide_lang_intro:
      'Norskeord has two separate language settings. The interface language (set in Profile → Preferences) controls the menus, labels, and text throughout the app — you can use it in English, Spanish, or Ukrainian.',
    guide_lang_change:
      'The flashcard language controls what the back of each card shows — the translation you see after flipping. This is also set in Profile → Preferences and can be changed independently of the interface language.',

    // Updated FAQ entry (v2 replaces the old inaccurate one)
    guide_faq_freeplus_a_v2:
      'Free gives you all A1 and A2 vocabulary, a preview of B1/B2, the top 3 quiz categories per level, and 4 grammar topics. Plus unlocks all vocabulary levels (B1–C2), smart Due today scheduling, cross-device sync, all quiz categories, all grammar topics, Norskprøven practice tests (Tests 2 and up), full-text search, and lesson emails. See the full comparison:',

    // New FAQ entry for Norskprøven
    guide_faq_norskproven_q: 'What is Norskprøven and who should use the prep section?',
    guide_faq_norskproven_a:
      "Norskprøven is the official Norwegian language exam required for permanent residency and citizenship. If you're aiming for A2 (minimum for residency) or B1 (required for citizenship), the Norskprøven section gives you vocabulary focused on the exam's topic areas plus full practice tests covering reading, writing, and oral tasks.",

    // Volunteer note (moved from intro to footer of page)
    guide_volunteer_note:
      'In Norway, many cities have free Norwegian courses run by volunteers — such as Røde Kors Norsktrening. A sincere thank you to everyone who volunteers their time to help us learn Norwegian.'
  },

  nb: {
    guide_anchor_start: 'Kom i gang',
    guide_anchor_flashcards: 'Flashkort',
    guide_anchor_quiz: 'Quiz',
    guide_anchor_grammar: 'Grammatikk',
    guide_anchor_norskproven: 'Norskprøven',
    guide_anchor_faq: 'Spørsmål og svar',

    guide_start_heading: 'Kom i gang',
    guide_start_intro:
      'Norskeord har fire læringsmodus. Her er en rask oversikt over hva som passer deg best akkurat nå:',
    guide_start_path_beginner_label: 'Ny på norsk?',
    guide_start_path_beginner_desc: 'Start med A1-flashkort — hverdagsord med lyd på hvert kort.',
    guide_start_path_beginner_cta: 'Se A1-kategorier →',
    guide_start_path_exam_label: 'Forbereder du deg til Norskprøven?',
    guide_start_path_exam_desc:
      'Gå rett til eksamensforberedelsesseksjonen, organisert etter temaene som dukker opp på prøven.',
    guide_start_path_exam_cta: 'Norskprøven-forberedelse →',
    guide_start_path_quiz_label: 'Vil du teste deg selv?',
    guide_start_path_quiz_desc: 'Quizmodus krever at du aktivt husker ord, ikke bare snur kort.',
    guide_start_path_quiz_cta: 'Prøv quizen →',
    guide_start_path_grammar_label: 'Sliter du med grammatikken?',
    guide_start_path_grammar_desc:
      'Grammatikkøvelser dekker setningsstruktur, ikke-plassering og mer.',
    guide_start_path_grammar_cta: 'Øv på grammatikk →',
    guide_start_note:
      'Alle fire modus oppdaterer repetisjonsskjemaet ditt — flashkort, quiz og grammatikk deler samme fremgang.',

    guide_flashcards_heading: 'Flashkort',
    guide_flashcards_intro:
      'Flashkort er grunnlaget i Norskeord. Hvert kort har lyd, og du kan velge mellom norsk → engelsk, engelsk → norsk, eller definisjon → norsk (B1 og over). Vurder hvert kort etter å ha snudd det for å holde repetisjonsskjemaet nøyaktig.',

    guide_quiz_heading: 'Quizmodus',
    guide_quiz_intro:
      'Quizmodus tester aktiv gjenkalling — du må produsere eller gjenkjenne et svar, ikke bare snu et kort. Det er tre spørsmålstyper:',
    guide_quiz_mc:
      'Flervalg — velg riktig oversettelse blant fire alternativer. Trykk A B C D på tastaturet.',
    guide_quiz_fill_label: 'Fyll inn',
    guide_quiz_fill: 'Fyll inn blanken — fullfør en setning med det manglende norske ordet.',
    guide_quiz_type_label: 'Skriv',
    guide_quiz_type:
      'Skriftlig svar — skriv det norske ordet for et engelsk spørsmål fra hukommelsen.',
    guide_quiz_scheduling:
      'Hvert quizsvar oppdaterer repetisjonsskjemaet ditt, akkurat som flashkortvurderinger. Riktige svar forlenger neste repetisjonsfrist; feil svar bringer kortet tilbake tidligere.',
    guide_quiz_access:
      '<strong>Gratis:</strong> de 3 beste kategoriene per nivå. <strong>Plus:</strong> alle kategorier på alle nivåer.',
    guide_quiz_access_cta: 'Se Plus →',

    guide_grammar_heading: 'Grammatikkøvelser',
    guide_grammar_intro:
      'Grammatikkøvelsene fokuserer på de strukturelle reglene i norsk som ordforråd alene ikke kan lære deg. Temaer er organisert etter CEFR-nivå og dekker:',
    guide_grammar_type_fill: 'Fyll inn blanken — skriv inn riktig form av et ord i kontekst.',
    guide_grammar_type_order: 'Ordrekkefølge — ordne ord til en grammatisk korrekt norsk setning.',
    guide_grammar_type_transform:
      'Omform — omskriv en setning etter en regel (f.eks. negasjon, tempusendring).',
    guide_grammar_rule:
      'Etter hvert svar ser du grammatikkregelen som forklarer hvorfor — med et valgfritt dypere innlegg hvis du vil ha full forklaring.',
    guide_grammar_access:
      '<strong>Gratis:</strong> 4 grammatikktemaer. <strong>Plus:</strong> alle temaer inkludert avanserte setningsomforminger.',
    guide_grammar_access_cta: 'Se Plus →',

    guide_norskproven_heading: 'Norskprøvenforberedelse',
    guide_norskproven_what:
      'Norskprøven er den offisielle norskprøven — nødvendig for permanent oppholdstillatelse og statsborgerskap. Norskeord dekker dette på to måter: ordforrådsdesks fokusert på eksamenstemaer (under Norskprøven-menyen) og fulle prøveprøver.',
    guide_norskproven_how: 'Prøveprøver er eksamensoppgaver på A2- og B1-nivå, i tre formater:',
    guide_norskproven_reading: 'Lesing — korte tekster med flervalgsspørsmål om innhold.',
    guide_norskproven_writing:
      'Skriving — strukturerte oppgaver med modellesvar så du kan sammenligne svaret ditt.',
    guide_norskproven_oral:
      'Muntlig — rollespillscenarioer og diskusjonsspørsmål med innebygd 2-minutters forberedelsesstimer.',
    guide_norskproven_access:
      '<strong>Gratis:</strong> Prøveprøve 1 på A2 og B1. <strong>Plus:</strong> alle prøveprøver.',
    guide_norskproven_access_cta: 'Se Plus →',

    guide_lang_heading: 'Flashkortspråk vs. grensesnittspråk',
    guide_lang_intro:
      'Norskeord har to separate språkinnstillinger. Grensesnittspråket (angitt i Profil → Innstillinger) styrer menyer, etiketter og tekst i hele appen — du kan bruke det på engelsk, spansk eller ukrainsk.',
    guide_lang_change:
      'Flashkortspråket styrer hva baksiden av hvert kort viser — oversettelsen du ser etter å ha snudd. Dette angis også i Profil → Innstillinger og kan endres uavhengig av grensesnittspråket.',

    guide_faq_freeplus_a_v2:
      'Gratis gir deg alt A1- og A2-ordforråd, forhåndsvisning av B1/B2, de 3 beste quizkategoriene per nivå og 4 grammatikktemaer. Plus låser opp alle vokabularnivåer (B1–C2), smart «Forfaller i dag»-planlegging, synkronisering på tvers av enheter, alle quizkategorier, alle grammatikktemaer, Norskprøven-prøveprøver (prøve 2 og oppover), fulltekstsøk og timesemails. Se full sammenligning:',

    guide_faq_norskproven_q: 'Hva er Norskprøven og hvem bør bruke forberedelsesseksjonen?',
    guide_faq_norskproven_a:
      'Norskprøven er den offisielle norskeksamen som kreves for permanent oppholdstillatelse og statsborgerskap. Hvis du sikter mot A2 (minimum for oppholdstillatelse) eller B1 (nødvendig for statsborgerskap), gir Norskprøven-seksjonen deg ordforråd fokusert på eksamenens temaer pluss fulle prøveprøver som dekker lese-, skrive- og muntlige oppgaver.',

    guide_volunteer_note:
      'I Norge tilbyr mange byer gratis norskkurs drevet av frivillige — som Røde Kors Norsktrening. En hjertelig takk til alle som bruker sin tid til å hjelpe oss med å lære norsk.'
  },

  es: {
    guide_anchor_start: 'Por dónde empezar',
    guide_anchor_flashcards: 'Tarjetas',
    guide_anchor_quiz: 'Quiz',
    guide_anchor_grammar: 'Gramática',
    guide_anchor_norskproven: 'Norskprøven',
    guide_anchor_faq: 'Preguntas frecuentes',

    guide_start_heading: 'Por dónde empezar',
    guide_start_intro:
      'Norskeord tiene cuatro modos de aprendizaje. Aquí tienes una guía rápida para elegir el que mejor se adapta a tu objetivo:',
    guide_start_path_beginner_label: '¿Eres nuevo en noruego?',
    guide_start_path_beginner_desc:
      'Empieza con las tarjetas A1 — palabras cotidianas con audio en cada tarjeta.',
    guide_start_path_beginner_cta: 'Ver categorías A1 →',
    guide_start_path_exam_label: '¿Preparas el Norskprøven?',
    guide_start_path_exam_desc:
      'Ve directamente a la sección de preparación del examen, organizada por los temas que aparecen en la prueba.',
    guide_start_path_exam_cta: 'Preparación Norskprøven →',
    guide_start_path_quiz_label: '¿Quieres ponerte a prueba?',
    guide_start_path_quiz_desc:
      'El modo quiz te pide que recuerdes palabras activamente, no solo que des la vuelta a las tarjetas.',
    guide_start_path_quiz_cta: 'Probar el quiz →',
    guide_start_path_grammar_label: '¿Tienes dificultades con la gramática?',
    guide_start_path_grammar_desc:
      'Los ejercicios de gramática cubren el orden de palabras, la posición de "ikke" y más.',
    guide_start_path_grammar_cta: 'Practicar gramática →',
    guide_start_note:
      'Los cuatro modos actualizan tu calendario de repaso — las tarjetas, el quiz y la gramática comparten el mismo progreso.',

    guide_flashcards_heading: 'Tarjetas de vocabulario',
    guide_flashcards_intro:
      'Las tarjetas son la base de Norskeord. Cada tarjeta tiene audio, y puedes alternar entre noruego → español, español → noruego, o definición → noruego (B1 y superior). Valora cada tarjeta después de darle la vuelta para mantener tu calendario de repaso preciso.',

    guide_quiz_heading: 'Modo quiz',
    guide_quiz_intro:
      'El modo quiz pone a prueba el recuerdo activo — tienes que producir o reconocer una respuesta, no solo girar una tarjeta. Hay tres tipos de preguntas:',
    guide_quiz_mc:
      'Opción múltiple — elige la traducción correcta entre cuatro opciones. Pulsa A B C D en el teclado.',
    guide_quiz_fill_label: 'Rellenar',
    guide_quiz_fill: 'Rellena el hueco — completa una frase con la palabra noruega que falta.',
    guide_quiz_type_label: 'Escribir',
    guide_quiz_type:
      'Respuesta escrita — escribe de memoria la palabra noruega para una indicación en español.',
    guide_quiz_scheduling:
      'Cada respuesta del quiz actualiza tu calendario de repetición espaciada, igual que las valoraciones de las tarjetas. Las respuestas correctas amplían el intervalo del próximo repaso; las incorrectas traen la tarjeta antes.',
    guide_quiz_access:
      '<strong>Gratis:</strong> las 3 mejores categorías por nivel. <strong>Plus:</strong> todas las categorías en todos los niveles.',
    guide_quiz_access_cta: 'Ver Plus →',

    guide_grammar_heading: 'Práctica de gramática',
    guide_grammar_intro:
      'Los ejercicios de gramática se centran en las reglas estructurales del noruego que el vocabulario solo no puede enseñar. Los temas están organizados por nivel MCER y cubren:',
    guide_grammar_type_fill:
      'Rellena el hueco — escribe la forma correcta de una palabra en contexto.',
    guide_grammar_type_order:
      'Orden de palabras — ordena palabras para formar una oración noruega gramaticalmente correcta.',
    guide_grammar_type_transform:
      'Transforma — reescribe una oración siguiendo una regla (p. ej. negación, cambio de tiempo).',
    guide_grammar_rule:
      'Después de cada respuesta, verás la regla gramatical que explica el porqué — con una lectura más profunda opcional si quieres la explicación completa.',
    guide_grammar_access:
      '<strong>Gratis:</strong> 4 temas de gramática. <strong>Plus:</strong> todos los temas incluyendo transformaciones de oraciones avanzadas.',
    guide_grammar_access_cta: 'Ver Plus →',

    guide_norskproven_heading: 'Preparación para el Norskprøven',
    guide_norskproven_what:
      'El Norskprøven es el examen oficial de noruego — necesario para la residencia permanente y la ciudadanía. Norskeord lo cubre de dos maneras: mazos de vocabulario centrados en los temas del examen (bajo el menú Norskprøven) y pruebas de práctica completas.',
    guide_norskproven_how:
      'Las pruebas de práctica son tareas al estilo del examen en nivel A2 y B1, en tres formatos:',
    guide_norskproven_reading:
      'Lectura — textos cortos con preguntas de comprensión de opción múltiple.',
    guide_norskproven_writing:
      'Escritura — indicaciones estructuradas con respuestas modelo para que puedas comparar tu respuesta.',
    guide_norskproven_oral:
      'Oral — escenarios de juego de roles y preguntas de debate con un temporizador de preparación de 2 minutos.',
    guide_norskproven_access:
      '<strong>Gratis:</strong> Prueba de práctica 1 en A2 y B1. <strong>Plus:</strong> todas las pruebas de práctica.',
    guide_norskproven_access_cta: 'Ver Plus →',

    guide_lang_heading: 'Idioma de las tarjetas vs idioma de la interfaz',
    guide_lang_intro:
      'Norskeord tiene dos configuraciones de idioma separadas. El idioma de la interfaz (establecido en Perfil → Preferencias) controla los menús, las etiquetas y el texto en toda la aplicación — puedes usarla en inglés, español o ucraniano.',
    guide_lang_change:
      'El idioma de las tarjetas controla lo que muestra la parte trasera de cada tarjeta — la traducción que ves después de darle la vuelta. También se configura en Perfil → Preferencias y puede cambiarse independientemente del idioma de la interfaz.',

    guide_faq_freeplus_a_v2:
      'Gratis te da todo el vocabulario A1 y A2, una vista previa de B1/B2, las 3 mejores categorías de quiz por nivel y 4 temas de gramática. Plus desbloquea todos los niveles de vocabulario (B1–C2), la programación inteligente de «Vence hoy», sincronización entre dispositivos, todas las categorías de quiz, todos los temas de gramática, pruebas de práctica del Norskprøven (Prueba 2 en adelante), búsqueda de texto completo y correos electrónicos de lección. Ver la comparación completa:',

    guide_faq_norskproven_q:
      '¿Qué es el Norskprøven y quién debería usar la sección de preparación?',
    guide_faq_norskproven_a:
      'El Norskprøven es el examen oficial de noruego requerido para la residencia permanente y la ciudadanía. Si apuntas al A2 (mínimo para la residencia) o B1 (requerido para la ciudadanía), la sección Norskprøven te proporciona vocabulario centrado en los temas del examen, además de pruebas de práctica completas que cubren tareas de lectura, escritura y expresión oral.',

    guide_volunteer_note:
      'En Noruega, muchas ciudades ofrecen cursos de noruego gratuitos dirigidos por voluntarios — como Røde Kors Norsktrening. Un sincero agradecimiento a todos los que dedican su tiempo a ayudarnos a aprender noruego.'
  },

  uk: {
    guide_anchor_start: 'З чого почати',
    guide_anchor_flashcards: 'Картки',
    guide_anchor_quiz: 'Вікторина',
    guide_anchor_grammar: 'Граматика',
    guide_anchor_norskproven: 'Норскпрьовен',
    guide_anchor_faq: 'Питання та відповіді',

    guide_start_heading: 'З чого почати',
    guide_start_intro:
      'Norskeord має чотири режими навчання. Ось короткий посібник, який із них підходить для вашої мети зараз:',
    guide_start_path_beginner_label: 'Вперше вивчаєте норвезьку?',
    guide_start_path_beginner_desc:
      'Почніть із карток A1 — повсякденні слова з аудіо на кожній картці.',
    guide_start_path_beginner_cta: 'Переглянути категорії A1 →',
    guide_start_path_exam_label: 'Готуєтесь до Norskprøven?',
    guide_start_path_exam_desc:
      'Перейдіть одразу до розділу підготовки до іспиту, організованого за темами, що зустрічаються на тесті.',
    guide_start_path_exam_cta: 'Підготовка до Norskprøven →',
    guide_start_path_quiz_label: 'Хочете перевірити себе?',
    guide_start_path_quiz_desc:
      'Режим вікторини вимагає активного пригадування слів, а не просто перевертання карток.',
    guide_start_path_quiz_cta: 'Спробувати вікторину →',
    guide_start_path_grammar_label: 'Маєте труднощі з граматикою?',
    guide_start_path_grammar_desc:
      'Граматичні вправи охоплюють порядок слів, розміщення "ikke" та інше.',
    guide_start_path_grammar_cta: 'Практикувати граматику →',
    guide_start_note:
      'Усі чотири режими оновлюють ваш розклад повторення — картки, вікторина та граматика спільно використовують один прогрес.',

    guide_flashcards_heading: 'Картки словника',
    guide_flashcards_intro:
      'Картки є основою Norskeord. Кожна картка має аудіо, і ви можете перемикатися між норвезьким → українською, українською → норвезьким, або визначенням → норвезьким (B1 і вище). Оцінюйте кожну картку після перевертання, щоб підтримувати точний розклад повторення.',

    guide_quiz_heading: 'Режим вікторини',
    guide_quiz_intro:
      'Режим вікторини тестує активне пригадування — вам потрібно відтворити або розпізнати відповідь, а не просто перевернути картку. Є три типи запитань:',
    guide_quiz_mc:
      'Множинний вибір — виберіть правильний переклад із чотирьох варіантів. Натисніть A B C D на клавіатурі.',
    guide_quiz_fill_label: 'Заповнити',
    guide_quiz_fill: 'Заповніть пропуск — завершіть речення норвезьким словом, якого не вистачає.',
    guide_quiz_type_label: 'Написати',
    guide_quiz_type:
      "Письмова відповідь — напишіть норвезьке слово для англійської підказки по пам'яті.",
    guide_quiz_scheduling:
      'Кожна відповідь вікторини оновлює ваш розклад інтервального повторення так само, як і оцінки карток. Правильні відповіді збільшують інтервал наступного повторення; неправильні повертають картку раніше.',
    guide_quiz_access:
      '<strong>Безкоштовно:</strong> 3 найкращі категорії на рівень. <strong>Plus:</strong> всі категорії на всіх рівнях.',
    guide_quiz_access_cta: 'Переглянути Plus →',

    guide_grammar_heading: 'Граматичні вправи',
    guide_grammar_intro:
      'Граматичні вправи зосереджені на структурних правилах норвезької мови, яким словниковий запас сам по собі не може навчити. Теми організовані за рівнем CEFR і охоплюють:',
    guide_grammar_type_fill: 'Заповніть пропуск — введіть правильну форму слова в контексті.',
    guide_grammar_type_order:
      'Порядок слів — розташуйте слова у граматично правильне норвезьке речення.',
    guide_grammar_type_transform:
      'Перетворення — перепишіть речення за правилом (напр. заперечення, зміна часу).',
    guide_grammar_rule:
      "Після кожної відповіді ви побачите граматичне правило, яке пояснює причину — з необов'язковим глибшим читанням, якщо ви хочете повне пояснення.",
    guide_grammar_access:
      '<strong>Безкоштовно:</strong> 4 граматичні теми. <strong>Plus:</strong> всі теми, включаючи складні перетворення речень.',
    guide_grammar_access_cta: 'Переглянути Plus →',

    guide_norskproven_heading: 'Підготовка до Norskprøven',
    guide_norskproven_what:
      'Norskprøven — це офіційний норвезький мовний іспит, необхідний для постійного проживання та громадянства. Norskeord охоплює його двома способами: колоди словника, зосереджені на темах іспиту (у меню Norskprøven), та повні практичні тести.',
    guide_norskproven_how:
      'Практичні тести — це завдання у стилі іспиту рівнів A2 та B1, у трьох форматах:',
    guide_norskproven_reading:
      'Читання — короткі тексти з питаннями на розуміння з множинним вибором.',
    guide_norskproven_writing:
      'Письмо — структуровані завдання з зразковими відповідями для порівняння вашої відповіді.',
    guide_norskproven_oral:
      'Усне мовлення — рольові сценарії та дискусійні запитання із вбудованим 2-хвилинним таймером підготовки.',
    guide_norskproven_access:
      '<strong>Безкоштовно:</strong> Практичний тест 1 рівнів A2 та B1. <strong>Plus:</strong> всі практичні тести.',
    guide_norskproven_access_cta: 'Переглянути Plus →',

    guide_lang_heading: 'Мова карток vs мова інтерфейсу',
    guide_lang_intro:
      'Norskeord має два окремих налаштування мови. Мова інтерфейсу (встановлена в Профіль → Налаштування) керує меню, мітками та текстом у всьому додатку — ви можете використовувати його англійською, іспанською або українською.',
    guide_lang_change:
      'Мова карток керує тим, що показує зворотна сторона кожної картки — переклад, який ви бачите після перевертання. Вона також встановлюється в Профіль → Налаштування і може змінюватися незалежно від мови інтерфейсу.',

    guide_faq_freeplus_a_v2:
      'Безкоштовно ви отримуєте весь словник A1 та A2, перегляд B1/B2, 3 найкращі категорії вікторини на рівень та 4 граматичні теми. Plus розблоковує всі рівні словника (B1–C2), інтелектуальне планування «Потрібно сьогодні», синхронізацію між пристроями, всі категорії вікторини, всі граматичні теми, практичні тести Norskprøven (тест 2 і далі), повнотекстовий пошук та навчальні листи. Дивіться повне порівняння:',

    guide_faq_norskproven_q: 'Що таке Norskprøven і хто повинен використовувати розділ підготовки?',
    guide_faq_norskproven_a:
      'Norskprøven — це офіційний норвезький іспит, необхідний для постійного проживання та громадянства. Якщо ви прагнете до A2 (мінімум для проживання) або B1 (необхідний для громадянства), розділ Norskprøven надає вам словник, зосереджений на темах іспиту, плюс повні практичні тести, що охоплюють читання, письмо та усне мовлення.',

    guide_volunteer_note:
      'У Норвегії в багатьох містах є безкоштовні курси норвезької мови, які ведуть волонтери — наприклад, Røde Kors Norsktrening. Щира подяка всім, хто витрачає свій час, щоб допомогти нам вивчати норвезьку.'
  }
};

// ─── PATCH FUNCTION ───────────────────────────────────────────────────────────

function patchLocale(locale, keys) {
  const filePath = join(messagesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  let added = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(keys)) {
    if (key in data) {
      skipped++;
    } else {
      data[key] = value;
      added++;
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ ${locale}.json — added ${added} keys, skipped ${skipped} existing`);
}

// ─── RUN ──────────────────────────────────────────────────────────────────────

for (const [locale, keys] of Object.entries(newKeys)) {
  patchLocale(locale, keys);
}

console.log(
  '\nDone. Re-run `pnpm paraglide:compile` if needed to regenerate the compiled messages.'
);
