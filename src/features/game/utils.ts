import confetti from "canvas-confetti";

export const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });
    confetti({
      particleCount: 5,
      angle: 90,
      spread: 60,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };
  frame();
};
