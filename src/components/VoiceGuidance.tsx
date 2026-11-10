"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays Nepali guidance. Prefers a recorded MP3 (public/audio/<condition>.mp3,
 * recorded by a NAFHA expert) and falls back to the device's Nepali text-to-speech.
 */
export default function VoiceGuidance({ text, audioSrc: candidate }: { text: string; audioSrc: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  // Use the recorded MP3 only if it has actually been uploaded to public/audio.
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(candidate, { method: "HEAD" })
      .then((r) => alive && r.ok && (r.headers.get("content-type") ?? "").startsWith("audio") && setAudioSrc(candidate))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [candidate]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function stop() {
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }

  async function play() {
    setHint(null);
    if (audioSrc) {
      const a = (audioRef.current ??= new Audio(audioSrc));
      a.currentTime = 0;
      a.onended = () => setPlaying(false);
      setPlaying(true);
      try {
        await a.play();
        return;
      } catch {
        setPlaying(false);
      }
    }
    if (!("speechSynthesis" in window)) {
      setHint("This device cannot play speech. Please read the text aloud to the farmer.");
      return;
    }
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    if (!voices.length) {
      await new Promise<void>((r) => {
        synth.addEventListener("voiceschanged", () => r(), { once: true });
        setTimeout(r, 1000);
      });
      voices = synth.getVoices();
    }
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith("ne"));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "ne-NP";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    if (!voice)
      setHint(
        "No Nepali voice found on this device. If there is no sound, install Nepali text-to-speech (Android: Settings → Text-to-speech) or ask NAFHA for the recorded audio.",
      );
    synth.cancel();
    setPlaying(true);
    synth.speak(u);
  }

  return (
    <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-600/20">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : play}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800"
        >
          <span aria-hidden>{playing ? "■" : "▶"}</span>
          {playing ? "रोक्नुहोस् (Stop)" : "सल्लाह सुन्नुहोस् (Play in Nepali)"}
        </button>
        <span className="text-xs text-emerald-800">
          {audioSrc ? "Recorded voice" : "Device text-to-speech"}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-slate-800" lang="ne">
        {text}
      </p>
      {hint && <p className="mt-2 text-xs text-amber-800">{hint}</p>}
    </div>
  );
}
