import { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  maxVerticalDeviation?: number;
  disabled?: boolean;
}

interface SwipeState {
  isDragging: boolean;
  dragOffset: number;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  minSwipeVelocity = 0.3,
  maxVerticalDeviation = 50,
  disabled = false,
}: SwipeConfig) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragOffset: 0,
  });

  const elementRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<TouchPosition | null>(null);
  const touchCurrent = useRef<TouchPosition | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchCurrent.current = touchStart.current;
      isHorizontalSwipe.current = null;
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || !touchStart.current) return;

      const touch = e.touches[0];
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if this is a horizontal swipe on first significant movement
      if (isHorizontalSwipe.current === null && (absDeltaX > 10 || absDeltaY > 10)) {
        isHorizontalSwipe.current = absDeltaX > absDeltaY;

        // Try to prevent default early if it's a horizontal swipe
        if (isHorizontalSwipe.current && e.cancelable) {
          e.preventDefault();
        }
      }

      // Only proceed if we've determined this is a horizontal swipe
      if (isHorizontalSwipe.current) {
        // Check if vertical deviation is within acceptable range
        if (absDeltaY <= maxVerticalDeviation) {
          // Try to prevent default scrolling for horizontal swipes (only if cancelable)
          if (e.cancelable) {
            e.preventDefault();
          }

          // Update drag offset for visual feedback
          setSwipeState({
            isDragging: true,
            dragOffset: deltaX,
          });
        }
      }
    },
    [disabled, maxVerticalDeviation]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || !touchStart.current || !touchCurrent.current) {
      setSwipeState({ isDragging: false, dragOffset: 0 });
      return;
    }

    // Only process if this was determined to be a horizontal swipe
    if (!isHorizontalSwipe.current) {
      setSwipeState({ isDragging: false, dragOffset: 0 });
      touchStart.current = null;
      touchCurrent.current = null;
      isHorizontalSwipe.current = null;
      return;
    }

    const deltaX = touchCurrent.current.x - touchStart.current.x;
    const deltaY = touchCurrent.current.y - touchStart.current.y;
    const deltaTime = touchCurrent.current.time - touchStart.current.time;

    const distance = Math.abs(deltaX);
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;
    const verticalDeviation = Math.abs(deltaY);

    // Check if swipe meets all criteria
    const isValidSwipe =
      distance >= minSwipeDistance &&
      velocity >= minSwipeVelocity &&
      verticalDeviation <= maxVerticalDeviation;

    if (isValidSwipe) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    // Reset state
    setSwipeState({ isDragging: false, dragOffset: 0 });
    touchStart.current = null;
    touchCurrent.current = null;
    isHorizontalSwipe.current = null;
  }, [disabled, minSwipeDistance, minSwipeVelocity, maxVerticalDeviation, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    setSwipeState({ isDragging: false, dragOffset: 0 });
    touchStart.current = null;
    touchCurrent.current = null;
    isHorizontalSwipe.current = null;
  }, []);

  // Attach native event listeners with passive: false
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    ...swipeState,
    ref: elementRef,
  };
}
