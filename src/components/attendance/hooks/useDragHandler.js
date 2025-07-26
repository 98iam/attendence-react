import { useState, useCallback, useEffect } from 'react'

export const useDragHandler = (handleSwipe) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    deltaY: 0,
    startY: 0
  })

  const SWIPE_THRESHOLD = 80

  const handlePointerDown = (e) => {
    setDragState({
      isDragging: true,
      startY: e.clientY,
      deltaY: 0
    });
    e.preventDefault();
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragState.isDragging) return;

    const deltaY = e.clientY - dragState.startY;
    setDragState(prev => ({ ...prev, deltaY }));
  }, [dragState.isDragging, dragState.startY]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging) return;

    const { deltaY } = dragState;
    setDragState({ isDragging: false, deltaY: 0, startY: 0 });

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
      // Swipe up is present (deltaY is negative)
      // Swipe down is absent (deltaY is positive)
      handleSwipe(deltaY < 0 ? 'present' : 'absent');
    }
  }, [dragState.isDragging, dragState.deltaY, handleSwipe]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragState.isDragging, handlePointerMove, handlePointerUp]);

  return {
    dragState,
    handlePointerDown,
    SWIPE_THRESHOLD
  }
}