import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { checkUserLocationStatus, saveUserLocation } from '../api/locationApi';
import {
  SERVICE_AREA_PROMPT_DISMISSIBLE,
  isServiceAreaSkippedThisSession,
  markServiceAreaSkippedThisSession,
} from '../constants/serviceAreaPrompt';

const LocationPromptContext = createContext(null);

export function LocationPromptProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [businessProfileId, setBusinessProfileId] = useState(null);

  const checkIfShouldPrompt = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setShouldShowPrompt(false);
      setPromptVisible(false);
      setBusinessProfileId(null);
      return;
    }

    setIsLoading(true);
    try {
      const locationStatus = await checkUserLocationStatus(userId);
      const nextBusinessId = locationStatus.businessProfileId;
      setBusinessProfileId(nextBusinessId);

      if (locationStatus.hasConfirmedServiceArea) {
        setShouldShowPrompt(false);
        setPromptVisible(false);
        return;
      }

      const skipped =
        SERVICE_AREA_PROMPT_DISMISSIBLE &&
        nextBusinessId &&
        isServiceAreaSkippedThisSession(nextBusinessId);

      const shouldShow = !skipped;
      setShouldShowPrompt(shouldShow);

      if (shouldShow) {
        setTimeout(() => {
          setPromptVisible(true);
        }, 800);
      } else {
        setPromptVisible(false);
      }
    } catch (error) {
      console.error('Error checking location prompt status:', error);
      setShouldShowPrompt(false);
      setPromptVisible(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void checkIfShouldPrompt();
  }, [checkIfShouldPrompt]);

  const handleSaveLocation = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('Not signed in');
      }

      const result = await saveUserLocation(payload, businessProfileId);

      if (!result.ok) {
        throw result.error ?? new Error('Failed to save service area');
      }

      setPromptVisible(false);
      setShouldShowPrompt(false);

      return result;
    },
    [userId, businessProfileId],
  );

  const handleDismissPrompt = useCallback(() => {
    if (!SERVICE_AREA_PROMPT_DISMISSIBLE) return;
    if (businessProfileId) {
      markServiceAreaSkippedThisSession(businessProfileId);
    }
    setPromptVisible(false);
    setShouldShowPrompt(false);
  }, [businessProfileId]);

  const showPromptManually = useCallback(() => {
    setPromptVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      shouldShowPrompt,
      promptVisible,
      businessProfileId,
      handleSaveLocation,
      handleDismissPrompt,
      showPromptManually,
      recheckPromptStatus: checkIfShouldPrompt,
    }),
    [
      isLoading,
      shouldShowPrompt,
      promptVisible,
      businessProfileId,
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
