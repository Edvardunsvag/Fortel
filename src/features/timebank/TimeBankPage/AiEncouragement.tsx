import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEmployees } from "@/features/game/employees/queries";
import type { TimeBalance } from "../types";
import type { FagtimerBalance } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

const EDDI_EMAIL = "edvard.unsvag@fortedigital.com";
const EDDI_FIRST_NAME = "Edvard";
const EDDI_SURNAME = "Unsvåg";

interface AiEncouragementProps {
  timeBalance: TimeBalance;
  fagtimerBalance: FagtimerBalance;
}

export const AiEncouragement = ({ timeBalance, fagtimerBalance }: AiEncouragementProps) => {
  const { i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedAudioRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const hasStartedRef = useRef(false);

  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const { data: employees = [] } = useEmployees();

  const eddiAvatar =
    employees.find((e) => e.email?.toLowerCase() === EDDI_EMAIL)?.avatarImageUrl ||
    employees.find((e) => e.firstName === EDDI_FIRST_NAME && e.surname === EDDI_SURNAME)?.avatarImageUrl;

  // Fetch AI comment once when data is available
  useEffect(() => {
    const hasData = timeBalance.totalLogged > 0 || timeBalance.totalExpected > 0;

    // Don't fetch if no data or already started
    if (!hasData || hasStartedRef.current) return;

    // Mark as started to prevent duplicate calls
    hasStartedRef.current = true;
    isFetchingRef.current = true;

    // Reset state for new fetch
    setMessage("");
    setIsLoading(true);
    cachedAudioRef.current = null;

    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      setMessage(getFallback("no-config"));
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    timeoutIdRef.current = setTimeout(() => abortController.abort(), 30000);

    const { balance } = timeBalance;
    const sign = balance >= 0 ? "+" : "";
    const fagLeft = fagtimerBalance.available - fagtimerBalance.used;

    const systemPrompt = isNorwegian
      ? `Du er "Eddi" - en edgy, satirisk avatar. Maks 2-3 setninger på norsk. Vær spesifikk om tallene. Timesaldo = overtidspenger eller gjeld. Fagtimer = påkrevd faglig utvikling. Bruk humor og sass.`
      : `You are "Eddi" - an edgy, satirical Norwegian avatar. Max 2-3 sentences in English with Norwegian words like "faen", "herregud", "uff da". Be specific about numbers. Time balance = overtime money or debt. Fagtimer = required professional development. Use humor and sass.`;

    const userPrompt = isNorwegian
      ? `Timesaldo: ${sign}${balance.toFixed(1)}t. Logget: ${timeBalance.totalLogged.toFixed(1)}t/${timeBalance.totalExpected.toFixed(1)}t. Fagtimer: ${fagtimerBalance.used.toFixed(1)}t/${fagtimerBalance.available}t.${fagLeft > 0 ? ` ${fagLeft.toFixed(1)}t igjen!` : ""}`
      : `Balance: ${sign}${balance.toFixed(1)}h. Logged: ${timeBalance.totalLogged.toFixed(1)}h/${timeBalance.totalExpected.toFixed(1)}h. Fagtimer: ${fagtimerBalance.used.toFixed(1)}h/${fagtimerBalance.available}h.${fagLeft > 0 ? ` ${fagLeft.toFixed(1)}h left!` : ""}`;

    fetch(`${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: deployment,
        max_completion_tokens: 150,
        temperature: 1,
        stream: true,
      }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let fullMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
                if (content) {
                  fullMessage += content;
                  setMessage(fullMessage);

                  // Add small delay to make streaming slower and more visible
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
              } catch {
                /* skip */
              }
            }
          }
        }
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        setIsLoading(false);
        isFetchingRef.current = false;
        // Prefetch TTS with complete message
        if (fullMessage.trim()) {
          prefetchTts(fullMessage);
        }
      })
      .catch((error) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        setMessage(getFallback(error.name === "AbortError" ? "timeout" : "error"));
        setIsLoading(false);
        isFetchingRef.current = false;
      });

    async function prefetchTts(text: string) {
      if (!text) return;
      try {
        setIsTtsLoading(true);
        const response = await fetch(
          `${endpoint}openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "api-key": apiKey },
            body: JSON.stringify({ model: "gpt-4o-mini-tts", input: text, voice: "cedar" }),
          }
        );
        if (response.ok) {
          const blob = await response.blob();
          cachedAudioRef.current = URL.createObjectURL(blob);
        }
      } catch {
        /* ignore */
      } finally {
        setIsTtsLoading(false);
      }
    }

    function getFallback(type: string) {
      const sign = timeBalance.balance >= 0 ? "+" : "";
      const bal = timeBalance.balance.toFixed(1);
      if (type === "timeout")
        return isNorwegian
          ? `${sign}${bal}t - Eddi tenker på et svar... 🤔`
          : `${sign}${bal}h - Eddi is thinking for a response... 🤔`;
      if (type === "no-config") return isNorwegian ? `${sign}${bal}t 💪` : `${sign}${bal}h 💪`;
      return isNorwegian ? `${sign}${bal}t på bok 💸` : `${sign}${bal}h in the bank 💸`;
    }

    // No cleanup needed - hasStartedRef prevents re-runs
    // Run when timeBalance data becomes available (hasStartedRef prevents re-runs)
  }, [timeBalance.totalLogged, timeBalance.totalExpected]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  // Play TTS (uses cached audio if available)
  const handlePlayClick = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    if (!message) return;

    // Stop any existing audio before playing new one
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Use cached audio if available
    if (cachedAudioRef.current) {
      const audio = new Audio(cachedAudioRef.current);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      setIsPlaying(true);
      await audio.play();
      return;
    }

    // Fallback: fetch on demand
    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    if (!endpoint || !apiKey) return;

    try {
      setIsPlaying(true);
      const response = await fetch(
        `${endpoint}openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body: JSON.stringify({ model: "gpt-4o-mini-tts", input: message, voice: "cedar" }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      cachedAudioRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  if (!message && !isLoading) return null;

  return (
    <div className={styles.aiEncouragement}>
      <div className={styles.aiEncouragementHeader}>
        {eddiAvatar ? (
          <img src={eddiAvatar} alt="Eddi" className={styles.aiEncouragementAvatar} />
        ) : (
          <span className={styles.aiEncouragementIcon}>🎭</span>
        )}
        <span className={styles.aiEncouragementTitle}>Eddi</span>
        {message && !isLoading && (
          <button
            className={styles.aiEncouragementPlayButton}
            onClick={handlePlayClick}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isTtsLoading}
          >
            {isTtsLoading ? "⏳" : isPlaying ? "⏸️" : "🔊"}
          </button>
        )}
      </div>
      <div className={styles.aiEncouragementContent}>
        <p className={styles.aiEncouragementMessage}>
          {message}
          {isLoading && <span className={styles.aiEncouragementTyping}>▌</span>}
        </p>
      </div>
    </div>
  );
};
