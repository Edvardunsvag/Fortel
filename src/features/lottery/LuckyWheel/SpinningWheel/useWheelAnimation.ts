import { useRef, useCallback, useState, useEffect } from "react";

export interface UseWheelAnimationOptions {
  segmentCount: number;
  onSpinComplete?: (segmentIndex: number) => void;
}

export interface UseWheelAnimationReturn {
  rotation: number;
  isSpinning: boolean;
  spinToSegment: (targetIndex: number) => void;
  reset: () => void;
}

// Animation constants
const SPIN_DURATION = 6000; // 6 seconds
const EXTRA_ROTATIONS = 5; // 5 full rotations before landing

// Easing function: easeOutExpo for realistic deceleration
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const useWheelAnimation = ({
  segmentCount,
  onSpinComplete,
}: UseWheelAnimationOptions): UseWheelAnimationReturn => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const targetIndexRef = useRef<number>(0);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animate = useCallback(
    (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const easedProgress = easeOutExpo(progress);

      const currentRotation =
        startRotationRef.current +
        (targetRotationRef.current - startRotationRef.current) * easedProgress;

      setRotation(currentRotation);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsSpinning(false);
        startTimeRef.current = null;
        animationFrameRef.current = null;

        if (onSpinComplete) {
          onSpinComplete(targetIndexRef.current);
        }
      }
    },
    [onSpinComplete]
  );

  const spinToSegment = useCallback(
    (targetIndex: number) => {
      if (isSpinning || segmentCount === 0) return;

      setIsSpinning(true);
      targetIndexRef.current = targetIndex;

      // Calculate the angle per segment
      const segmentAngle = 360 / segmentCount;

      // The wheel is drawn with segment 0 starting at the TOP (-90° in canvas coordinates)
      // The pointer is on the RIGHT (0° in canvas coordinates)
      // Segment center angle (from top): segmentAngle * index + segmentAngle / 2
      const targetSegmentCenterFromTop = segmentAngle * targetIndex + segmentAngle / 2;

      // To land the target segment at the pointer (right side), we need to rotate
      // so that the segment's center moves from top to right (90° clockwise)
      // Formula: spinAmount = 90 - targetSegmentCenterFromTop
      const extraDegrees = EXTRA_ROTATIONS * 360;
      const currentNormalized = rotation % 360;

      // Calculate spin amount to land target segment at pointer
      let spinAmount = 90 - targetSegmentCenterFromTop - currentNormalized + extraDegrees;

      // Ensure we spin at least EXTRA_ROTATIONS times (always forward/clockwise)
      while (spinAmount < extraDegrees) {
        spinAmount += 360;
      }

      startRotationRef.current = rotation;
      targetRotationRef.current = rotation + spinAmount;
      startTimeRef.current = null;

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [isSpinning, segmentCount, rotation, animate]
  );

  const reset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRotation(0);
    setIsSpinning(false);
    startTimeRef.current = null;
    startRotationRef.current = 0;
    targetRotationRef.current = 0;
    targetIndexRef.current = 0;
  }, []);

  return {
    rotation,
    isSpinning,
    spinToSegment,
    reset,
  };
};
