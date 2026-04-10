import { useCallback } from "react";
import type { ControlMode } from "@/contexts/DesignContext";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { rooms } from "@/data/rooms";
import { styles } from "@/data/styles";

interface UseStageSwipeParams {
  activeMode: ControlMode;
  selectedCategory: string | null;
  selectedStyle: string | null;
  isGenerating: boolean;
  showRoomSwitchDialog: boolean;
  showStyleSwitchDialog: boolean;
  handleSelectCategory: (category: string | null) => void;
  handleSelectStyle: (style: string | null) => void;
}

export function getNextItem<T>(
  current: string | null,
  items: T[],
  direction: 'left' | 'right',
  getKey: (item: T) => string
): T {
  const currentIndex = items.findIndex((item) => getKey(item) === current);
  const validIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = direction === 'left'
    ? (validIndex + 1) % items.length
    : (validIndex - 1 + items.length) % items.length;
  return items[nextIndex];
}

export function getPrevItem<T>(
  current: string | null,
  items: T[],
  getKey: (item: T) => string
): T {
  return getNextItem(current, items, 'right', getKey);
}

export function useStageSwipe({
  activeMode,
  selectedCategory,
  selectedStyle,
  isGenerating,
  showRoomSwitchDialog,
  showStyleSwitchDialog,
  handleSelectCategory,
  handleSelectStyle,
}: UseStageSwipeParams) {
  const disabled = isGenerating || showRoomSwitchDialog || showStyleSwitchDialog;

  const handleSwipeLeft = useCallback(() => {
    if (disabled) return;

    switch (activeMode) {
      case 'rooms': {
        const nextRoom = getNextItem(selectedCategory, rooms, 'left', r => r.name);
        handleSelectCategory(nextRoom.name);
        break;
      }
      case 'styles': {
        const nextStyle = getNextItem(selectedStyle, styles, 'left', s => s.id);
        handleSelectStyle(nextStyle.id);
        break;
      }
      case 'palettes':
        // palettes mode is no longer active; no-op
        break;
    }
  }, [disabled, activeMode, selectedCategory, selectedStyle, handleSelectCategory, handleSelectStyle]);

  const handleSwipeRight = useCallback(() => {
    if (disabled) return;

    switch (activeMode) {
      case 'rooms': {
        const nextRoom = getNextItem(selectedCategory, rooms, 'right', r => r.name);
        handleSelectCategory(nextRoom.name);
        break;
      }
      case 'styles': {
        const nextStyle = getNextItem(selectedStyle, styles, 'right', s => s.id);
        handleSelectStyle(nextStyle.id);
        break;
      }
      case 'palettes':
        // palettes mode is no longer active; no-op
        break;
    }
  }, [disabled, activeMode, selectedCategory, selectedStyle, handleSelectCategory, handleSelectStyle]);

  const { isDragging, dragOffset, ref } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled,
  });

  return {
    isDragging,
    dragOffset,
    ref,
  };
}
