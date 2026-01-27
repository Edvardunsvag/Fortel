import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { fetchEmployees } from "@/features/game/employees/api";
import type { MonthlyWinner } from "../../api";
import styles from "./WinnerRevealCard.module.scss";

const EDDI_EMAIL = "edvard.unsvag@fortedigital.com";

interface EddiWinnerCommentProps {
  winner: MonthlyWinner;
  onTtsComplete?: () => void;
}

export const EddiWinnerComment = ({ winner, onTtsComplete }: EddiWinnerCommentProps) => {
  const { i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [autoPlayTriggered, setAutoPlayTriggered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedAudioRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);

  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const accessToken = useAppSelector(selectAccessToken);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmployees(accessToken),
    staleTime: Infinity,
    enabled: !!accessToken,
  });

  const eddiAvatar = employees?.find(
    (e: { email?: string | null }) => e.email?.toLowerCase() === EDDI_EMAIL
  )?.avatarImageUrl;

  // Generate AI comment for winner
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setMessage("");
    setIsLoading(true);
    cachedAudioRef.current = null;

    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      setMessage(getFallback());
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const positionText = winner.position === 1 ? "1st" : winner.position === 2 ? "2nd" : "3rd";
    const positionTextNb = winner.position === 1 ? "1." : winner.position === 2 ? "2." : "3.";

    const systemPrompt = isNorwegian
      ? `Du er "Eddi" - en edgy, satirisk norsk karakter som annonserer lotterivinnere. Maks 1-2 setninger. Vær morsom og gratuler vinneren entusiastisk! Bruk fargerike norske uttrykk som "helsikes fillansen", "fy flansen", "for en bondefansen", "nå steiker det i pansen", "hold på hatten og buksansen". Nevn gjerne vinnerens navn og plassering. Vær kreativ og overraskende!`
      : `You are "Eddi" - an edgy, satirical Norwegian character announcing lottery winners. Max 1-2 sentences in English with colorful Norwegian expressions. Be funny and congratulate the winner enthusiastically! Use fake-swears like "helsikes fillansen", "fy flansen på stransen", "for et bondefansen", "nå steiker det i pansen", "hold på hatten og buksansen". Mention the winner's name and position. Be creative and surprising!`;

    const userPrompt = isNorwegian
      ? `Gratulerer ${winner.name} med ${positionTextNb} plass! De hadde ${winner.ticketsConsumed} lodd.`
      : `Congratulate ${winner.name} for winning ${positionText} place! They had ${winner.ticketsConsumed} tickets.`;

    fetch(
      `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: deployment,
          max_completion_tokens: 100,
          temperature: 1.1,
          stream: true,
        }),
        signal: abortController.signal,
      }
    )
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
                const content = JSON.parse(line.slice(6)).choices?.[0]?.delta
                  ?.content;
                if (content) {
                  fullMessage += content;
                  setMessage(fullMessage);
                  await new Promise((resolve) => setTimeout(resolve, 30));
                }
              } catch {
                /* skip */
              }
            }
          }
        }
        setIsLoading(false);
        if (fullMessage.trim()) {
          prefetchTts(fullMessage);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setMessage(getFallback());
        }
        setIsLoading(false);
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
            body: JSON.stringify({
              model: "gpt-4o-mini-tts",
              input: text,
              voice: "cedar",
            }),
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

    function getFallback() {
      return isNorwegian
        ? `Gratulerer ${winner.name}! For en fillansen av en seier! 🎉`
        : `Congratulations ${winner.name}! What a helsikes fillansen of a win! 🎉`;
    }

    return () => {
      abortController.abort();
    };
  }, [winner, isNorwegian]);

  // Auto-play TTS when audio is ready
  useEffect(() => {
    if (cachedAudioRef.current && !autoPlayTriggered && !isLoading && !isTtsLoading) {
      setAutoPlayTriggered(true);
      handlePlayClick();
    }
  }, [cachedAudioRef.current, autoPlayTriggered, isLoading, isTtsLoading]);

  // Play/pause TTS
  const handlePlayClick = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    if (!message) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (cachedAudioRef.current) {
      const audio = new Audio(cachedAudioRef.current);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        onTtsComplete?.();
      };
      audio.onerror = () => {
        setIsPlaying(false);
        onTtsComplete?.();
      };
      setIsPlaying(true);
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
        onTtsComplete?.();
      }
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
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            input: message,
            voice: "cedar",
          }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      cachedAudioRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        onTtsComplete?.();
      };
      audio.onerror = () => {
        setIsPlaying(false);
        onTtsComplete?.();
      };
      await audio.play();
    } catch {
      setIsPlaying(false);
      onTtsComplete?.();
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (cachedAudioRef.current) {
        URL.revokeObjectURL(cachedAudioRef.current);
      }
    };
  }, []);

  if (!message && !isLoading) return null;

  return (
    <div className={styles.eddiSection}>
      <div className={styles.eddiHeader}>
        {eddiAvatar ? (
          <img src={eddiAvatar} alt="Eddi" className={styles.eddiAvatar} />
        ) : (
          <span className={styles.eddiIcon}>🎭</span>
        )}
        <span className={styles.eddiName}>Eddi</span>
        {message && !isLoading && (
          <button
            className={styles.eddiPlayButton}
            onClick={handlePlayClick}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isTtsLoading}
          >
            {isTtsLoading ? "⏳" : isPlaying ? "⏸️" : "🔊"}
          </button>
        )}
      </div>
      <div className={styles.eddiMessage}>
        <p>
          {message}
          {isLoading && <span className={styles.eddiTyping}>▌</span>}
        </p>
      </div>
    </div>
  );
};
