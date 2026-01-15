import { useMemo } from "react";
import styles from "./FloatingParticles.module.scss";

interface Particle {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FloatingParticlesProps {
  count?: number;
  color?: "gold" | "green" | "blue" | "mixed";
}

export const FloatingParticles = ({ count = 15, color = "mixed" }: FloatingParticlesProps) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2, // 2-8px
      left: Math.random() * 100, // 0-100%
      delay: Math.random() * 5, // 0-5s delay
      duration: Math.random() * 10 + 15, // 15-25s duration
      opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 opacity
    }));
  }, [count]);

  const getColorClass = () => {
    switch (color) {
      case "gold":
        return styles.gold;
      case "green":
        return styles.green;
      case "blue":
        return styles.blue;
      default:
        return styles.mixed;
    }
  };

  return (
    <div className={styles.particleContainer} aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`${styles.particle} ${getColorClass()}`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};
