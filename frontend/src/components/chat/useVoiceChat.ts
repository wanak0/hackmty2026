import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceChatSupported() {
  return Boolean(getSpeechRecognitionCtor());
}

export function speakMayaReply(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = "es-MX";
  utterance.rate = 1.02;
  const voices = window.speechSynthesis.getVoices();
  const spanish =
    voices.find((v) => v.lang === "es-MX") ||
    voices.find((v) => v.lang.startsWith("es"));
  if (spanish) utterance.voice = spanish;
  window.speechSynthesis.speak(utterance);
}

export function stopMayaSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

const SILENCE_MS = 2000;

export function useVoiceChat(onFinalTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  const stopRequested = useRef(false);
  const silenceTimer = useRef<number | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const clearSilenceTimer = () => {
    if (silenceTimer.current != null) {
      window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  };

  const stop = useCallback(() => {
    stopRequested.current = true;
    clearSilenceTimer();
    setListening(false);
    setInterim("");
    transcriptRef.current = "";
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("El dictado de voz funciona en Chrome o Edge.");
      return;
    }
    stopMayaSpeech();
    stopRequested.current = false;
    clearSilenceTimer();
    setError(null);
    setInterim("");
    transcriptRef.current = "";

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    const sendPrompt = () => {
      const text = transcriptRef.current.trim();
      stopRequested.current = true;
      clearSilenceTimer();
      setListening(false);
      setInterim("");
      transcriptRef.current = "";
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      if (text) onFinalRef.current(text);
    };

    const waitForSilence = () => {
      clearSilenceTimer();
      silenceTimer.current = window.setTimeout(sendPrompt, SILENCE_MS);
    };

    recognition.onresult = (event) => {
      let committed = "";
      let live = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) committed += `${piece} `;
        else live += piece;
      }
      const full = `${committed}${live}`.replace(/\s+/g, " ").trim();
      transcriptRef.current = full;
      setInterim(full);
      if (full) waitForSilence();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") {
        if (transcriptRef.current.trim()) sendPrompt();
        return;
      }
      clearSilenceTimer();
      if (event.error === "not-allowed") {
        setError("Permite el micrófono para hablarle a Maya.");
      } else {
        setError("No pude escucharte. Inténtalo de nuevo.");
      }
      setListening(false);
    };

    recognition.onend = () => {
      if (stopRequested.current) return;
      try {
        recognition.start();
      } catch {
        if (transcriptRef.current.trim()) sendPrompt();
        else setListening(false);
      }
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("No pude iniciar el micrófono.");
      setListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRequested.current = true;
      if (silenceTimer.current != null) {
        window.clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      stopMayaSpeech();
    };
  }, []);

  return {
    supported: isVoiceChatSupported(),
    listening,
    interim,
    error,
    start,
    stop,
  };
}
