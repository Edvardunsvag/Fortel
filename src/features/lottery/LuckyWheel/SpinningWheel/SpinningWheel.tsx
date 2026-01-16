import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import type { WheelSegment } from "../../api";
import { useWheelAnimation } from "./useWheelAnimation";
import styles from "./SpinningWheel.module.scss";

export interface SpinningWheelHandle {
  spinToSegment: (targetIndex: number) => void;
  reset: () => void;
}

interface SpinningWheelProps {
  segments: WheelSegment[];
  onSpinComplete?: (segmentIndex: number, segment: WheelSegment) => void;
  size?: number;
}

export const SpinningWheel = forwardRef<SpinningWheelHandle, SpinningWheelProps>(
  ({ segments, onSpinComplete, size = 400 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleSpinComplete = useCallback(
      (segmentIndex: number) => {
        if (onSpinComplete && segments[segmentIndex]) {
          onSpinComplete(segmentIndex, segments[segmentIndex]);
        }
      },
      [onSpinComplete, segments]
    );

    const { rotation, isSpinning, spinToSegment, reset } = useWheelAnimation({
      segmentCount: segments.length,
      onSpinComplete: handleSpinComplete,
    });

    // Expose methods to parent via ref
    // IMPORTANT: Include dependencies so the ref updates when segment count changes!
    useImperativeHandle(ref, () => ({
      spinToSegment,
      reset,
    }), [spinToSegment, reset]);

    // Draw the wheel
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Save state and apply rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      if (segments.length === 0) {
        // Draw empty wheel
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#2d3748";
        ctx.fill();
        ctx.strokeStyle = "#4a5568";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Draw segments
        const segmentAngle = (2 * Math.PI) / segments.length;

        segments.forEach((segment, index) => {
          const startAngle = index * segmentAngle - Math.PI / 2;
          const endAngle = startAngle + segmentAngle;

          // Draw segment
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = segment.color;
          ctx.fill();

          // Draw segment border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw inner ring glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw center hub
      const hubRadius = size / 8;

      // Hub shadow
      ctx.beginPath();
      ctx.arc(centerX + 2, centerY + 2, hubRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fill();

      // Hub gradient
      const hubGradient = ctx.createRadialGradient(
        centerX - hubRadius / 4,
        centerY - hubRadius / 4,
        0,
        centerX,
        centerY,
        hubRadius
      );
      hubGradient.addColorStop(0, "#ffd700");
      hubGradient.addColorStop(0.5, "#ffb700");
      hubGradient.addColorStop(1, "#ff8c00");

      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
      ctx.fillStyle = hubGradient;
      ctx.fill();

      // Hub border
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }, [segments, rotation, size]);

    return (
      <div className={styles.wheelContainer} style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className={`${styles.wheel} ${isSpinning ? styles.spinning : ""}`}
        />
        {/* Pointer */}
        <div className={styles.pointer}>
          <svg viewBox="0 0 30 50" className={styles.pointerSvg}>
            <path
              d="M15 0 L30 50 L15 40 L0 50 Z"
              fill="#ffd700"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    );
  }
);

SpinningWheel.displayName = "SpinningWheel";
