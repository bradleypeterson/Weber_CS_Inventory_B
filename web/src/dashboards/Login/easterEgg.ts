export const MAGIC_WORD_PHRASE = "Uh uh uh... you did not say the magic word.";

const MAGIC_WORD_AUDIO_PATH = "/audio/magic-word.mp3";

let magicWordAudio: HTMLAudioElement | null = null;

export async function playMagicWordEasterEgg() {
  // Allow disabling without removing code
  if (import.meta.env.VITE_ENABLE_MAGIC_WORD_EASTER_EGG === "0") return;

  try {
    if (!magicWordAudio) {
      magicWordAudio = new Audio(MAGIC_WORD_AUDIO_PATH);
      magicWordAudio.preload = "auto";
    }
    magicWordAudio.currentTime = 0;
    await magicWordAudio.play();
    return;
  } catch {
    // Fallback when file is missing or autoplay policy blocks it.
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(MAGIC_WORD_PHRASE);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

