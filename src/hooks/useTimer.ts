import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerReturn {
  timeRemaining: number;
  isActive: boolean;
  initialTime: number;
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  timeSpent: number;
}

export const useTimer = (onTimeUp?: () => void): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  const startTimer = useCallback((duration: number) => {
    setTimeRemaining(duration);
    setInitialTime(duration);
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timeRemaining > 0) {
      setIsActive(true);
    }
  }, [timeRemaining]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
    setInitialTime(0);
  }, []);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const timeSpent = initialTime - timeRemaining;

  // Update the ref when onTimeUp changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  return {
    timeRemaining,
    isActive,
    initialTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    timeSpent,
  };
};