import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import {
  checkUserLocationStatus,
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
      // Check if user has saved location data via this new system
      // If they have service_area AND service_radius, don't show the prompt
      // If they dismiss without saving, we'll ask again next time!
      const locationStatus = await checkUserLocationStatus(userId);

      // Show prompt if user hasn't provided location yet
      // Dismiss just closes the modal temporarily - we ask again next time
      const shouldShow = !locationStatus.hasLocation;

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

  const handleDismissPrompt = useCallback(() => {
    // Just close the modal - don't mark as permanently dismissed
    // User will see this again next time they open the app
    // Only way to stop seeing it is to actually save location data
    setPromptVisible(false);
  }, []);

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
