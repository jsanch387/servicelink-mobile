import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import {
  checkLocationPromptDismissed,
  markLocationPromptDismissed,
  saveUserLocation,
} from '../api/locationApi';

const LocationPromptContext = createContext(null);

export function LocationPromptProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);

  const checkIfShouldPrompt = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setShouldShowPrompt(false);
      return;
    }

    setIsLoading(true);
    try {
      // Only check if user has dismissed the prompt
      // Don't check for existing location data - this is a NEW location system
      // and we want to collect fresh, clean location data from all users
      const dismissStatus = await checkLocationPromptDismissed(userId);

      // Show prompt unless user has explicitly dismissed it
      const shouldShow = !dismissStatus.dismissed;

      setShouldShowPrompt(shouldShow);

      // Auto-show the prompt after a brief delay if needed
      if (shouldShow) {
        setTimeout(() => {
          setPromptVisible(true);
        }, 800);
      }
    } catch (error) {
      console.error('Error checking location prompt status:', error);
      setShouldShowPrompt(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void checkIfShouldPrompt();
  }, [checkIfShouldPrompt]);

  const handleSaveLocation = useCallback(
    async (locationData) => {
      if (!userId) {
        throw new Error('Not signed in');
      }

      const result = await saveUserLocation(userId, locationData);

      if (!result.ok) {
        throw result.error ?? new Error('Failed to save location');
      }

      setPromptVisible(false);
      setShouldShowPrompt(false);

      return result;
    },
    [userId],
  );

  const handleDismissPrompt = useCallback(async () => {
    setPromptVisible(false);

    if (userId) {
      await markLocationPromptDismissed(userId);
      setShouldShowPrompt(false);
    }
  }, [userId]);

  const showPromptManually = useCallback(() => {
    setPromptVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      shouldShowPrompt,
      promptVisible,
      handleSaveLocation,
      handleDismissPrompt,
      showPromptManually,
      recheckPromptStatus: checkIfShouldPrompt,
    }),
    [
      isLoading,
      shouldShowPrompt,
      promptVisible,
      handleSaveLocation,
      handleDismissPrompt,
      showPromptManually,
      checkIfShouldPrompt,
    ],
  );

  return <LocationPromptContext.Provider value={value}>{children}</LocationPromptContext.Provider>;
}

export function useLocationPrompt() {
  const ctx = useContext(LocationPromptContext);
  if (!ctx) {
    throw new Error('useLocationPrompt must be used within LocationPromptProvider');
  }
  return ctx;
}
