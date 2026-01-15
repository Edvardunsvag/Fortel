import confetti from "canvas-confetti";

/**
 * Green confetti burst for positive time balance
 */
export const triggerPositiveBalanceConfetti = () => {
  const colors = ["#22c55e", "#16a34a", "#4ade80", "#86efac", "#bbf7d0"];

  // Burst from center-left area (where balance card typically is)
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x: 0.3, y: 0.4 },
    colors,
    startVelocity: 30,
    gravity: 0.8,
    ticks: 100,
  });

  // Secondary burst slightly delayed
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 80,
      origin: { x: 0.35, y: 0.5 },
      colors,
      startVelocity: 25,
      gravity: 0.9,
      ticks: 80,
    });
  }, 150);
};

/**
 * Gold star confetti for reaching fagtimer goals
 */
export const triggerFagtimerGoalConfetti = () => {
  const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#fef08a", "#ffffff"];

  // Star-shaped burst effect
  const end = Date.now() + 1500;

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      shapes: ["star"],
      scalar: 1.2,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      shapes: ["star"],
      scalar: 1.2,
    });

    requestAnimationFrame(frame);
  };

  frame();
};

/**
 * Subtle sparkle effect for card interactions
 */
export const triggerSparkle = (x: number, y: number) => {
  confetti({
    particleCount: 15,
    spread: 360,
    origin: { x, y },
    colors: ["#fbbf24", "#ffffff", "#f59e0b"],
    startVelocity: 10,
    gravity: 0.5,
    ticks: 50,
    scalar: 0.6,
    shapes: ["circle"],
  });
};

/**
 * Rainbow celebration for special achievements
 */
export const triggerRainbowCelebration = () => {
  const colors = ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#1dd1a1", "#5f27cd"];
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });

    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
};
