import { useState, useCallback } from 'react';

interface ButtonState {
  [key: string]: boolean;
}

export const useButtonState = () => {
  const [activeButtons, setActiveButtons] = useState<ButtonState>({});

  const setButtonState = useCallback((key: string, isActive: boolean) => {
    setActiveButtons(prev => ({
      ...prev,
      [key]: isActive
    }));
  }, []);

  const isButtonActive = useCallback((key: string) => {
    return activeButtons[key] || false;
  }, [activeButtons]);

  const clearAllButtons = useCallback(() => {
    setActiveButtons({});
  }, []);

  return {
    activeButtons,
    setButtonState,
    isButtonActive,
    clearAllButtons
  };
}; 