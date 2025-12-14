export const useHaptic = () => {
  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(25),
    heavy: () => vibrate(50),
    success: () => vibrate([10, 50, 10]),
    error: () => vibrate([50, 100, 50]),
  };
};
