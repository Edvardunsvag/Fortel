import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "@/features/game/employees/api";
import type { TimeBalance } from "../types";
import type { FagtimerBalance } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

const EDDI_EMAIL = "edvard.unsvag@fortedigital.com";

interface AiEncouragementProps {
  timeBalance: TimeBalance;
  fagtimerBalance: FagtimerBalance;
}

export const AiEncouragement = ({ timeBalance, fagtimerBalance }: AiEncouragementProps) => {
  const { i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasFetchedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    staleTime: Infinity,
  });

  const eddiAvatar = employees?.find((e) => e.email?.toLowerCase() === EDDI_EMAIL)?.avatarImageUrl;

  // Fetch AI comment on mount
  useEffect(() => {
    const hasData = timeBalance.totalLogged > 0 || timeBalance.totalExpected > 0;
    if (!hasData || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      setMessage(getFallback("no-config"));
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    setIsLoading(true);

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
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
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
                }
              } catch { /* skip */ }
            }
          }
        }
        clearTimeout(timeoutId);
        setIsLoading(false);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        setMessage(getFallback(error.name === "AbortError" ? "timeout" : "error"));
        setIsLoading(false);
      });

    function getFallback(type: string) {
      const sign = timeBalance.balance >= 0 ? "+" : "";
      const bal = timeBalance.balance.toFixed(1);
      if (type === "timeout") return isNorwegian ? `${sign}${bal}t - Eddi tok kaffe ☕` : `${sign}${bal}h - Eddi went for coffee ☕`;
      if (type === "no-config") return isNorwegian ? `${sign}${bal}t 💪` : `${sign}${bal}h 💪`;
      return isNorwegian ? `${sign}${bal}t på bok 💸` : `${sign}${bal}h in the bank 💸`;
    }
  }, [timeBalance, fagtimerBalance, isNorwegian]);

  // Play TTS
  const handlePlayClick = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    if (!message) return;

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
      const audio = new Audio(URL.createObjectURL(blob));
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
          <button className={styles.aiEncouragementPlayButton} onClick={handlePlayClick} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸️" : "🔊"}
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
