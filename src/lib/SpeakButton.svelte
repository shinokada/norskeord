<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    word: string;
  }

  let { word }: Props = $props();

  const LS_SPEED = 'voice-settings-speed';
  const LS_PITCH = 'voice-settings-pitch';
  const LS_VOICE = 'voice-settings-voice';

  function getSaved(key: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    return localStorage.getItem(key) ?? fallback;
  }

  let speed = $state(getSaved(LS_SPEED, '1'));
  let pitch = $state(getSaved(LS_PITCH, '1'));

  let selectedVoiceName = $state('');
  let mounted = false;
  let pendingVoicesChangedHandler: EventListener | null = null;

  function loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const all = window.speechSynthesis.getVoices();
    const noVoices = all.filter((v) => v.lang.startsWith('nb') || v.lang.startsWith('no'));
    if (noVoices.length > 0) {
      const saved = localStorage.getItem(LS_VOICE);
      if (saved && noVoices.find((v) => v.name === saved)) {
        selectedVoiceName = saved;
      } else if (!selectedVoiceName || !noVoices.find((v) => v.name === selectedVoiceName)) {
        const nora = noVoices.find((v) => v.name.includes('Nora'));
        selectedVoiceName = (nora ?? noVoices[0]).name;
      }
    } else {
      selectedVoiceName = '';
    }
  }

  onMount(() => {
    mounted = true;
    // Read speed/pitch from localStorage on mount so we pick up any profile save
    // that wrote through applyToLocalStorage() in PreferencesSection.
    speed = getSaved(LS_SPEED, '1');
    pitch = getSaved(LS_PITCH, '1');
    loadVoices();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      mounted = false;
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (pendingVoicesChangedHandler) {
        window.speechSynthesis.removeEventListener('voiceschanged', pendingVoicesChangedHandler);
        pendingVoicesChangedHandler = null;
      }
    };
  });

  export function speak() {
    const text = word.trim();
    if (!text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Always re-read from localStorage so a profile save mid-session takes effect.
    speed = getSaved(LS_SPEED, '1');
    pitch = getSaved(LS_PITCH, '1');

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nb-NO';

    const doSpeak = () => {
      if (!mounted) return;
      const voices = window.speechSynthesis.getVoices();
      const voice = selectedVoiceName
        ? voices.find((v) => v.name === selectedVoiceName)
        : (voices.find((v) => v.lang.startsWith('nb') || v.lang.startsWith('no')) ?? voices[0]);
      if (voice) utterance.voice = voice;
      // Set rate/pitch after voice to prevent browser resetting them
      utterance.rate = parseFloat(speed);
      utterance.pitch = parseFloat(pitch);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      if (pendingVoicesChangedHandler) {
        window.speechSynthesis.removeEventListener('voiceschanged', pendingVoicesChangedHandler);
      }
      pendingVoicesChangedHandler = () => {
        pendingVoicesChangedHandler = null;
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', pendingVoicesChangedHandler, {
        once: true
      });
    }
  }
</script>

<button
  type="button"
  onclick={speak}
  class="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
  title="Pronounce Norwegian word"
  aria-label="Pronounce {word}"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
    <path
      d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z"
    />
    <path
      d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.061Z"
    />
  </svg>
  Pronounce
</button>
