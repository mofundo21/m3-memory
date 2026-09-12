'use client';

import { useCallback, useEffect, useState } from 'react';

export interface MemoryWizardState {
  // Page 2: YOUR MEMORY
  memoryText: string;
  whereWe: string;
  aroundWhen: string;
  whoElse: string;
  whatMadeStick: string;
  dontRemember: string;

  // Page 3: ADD TO THE MEMORY
  encounterDate: string;
  isApproximateDate: boolean;
  locationName: string;
  eventName: string;
  mediaLink: string;
  mediaConsent: boolean;
  mediaFiles: File[];

  // Page 4: LEAVE YOUR MARK
  submitterName: string;
  contact: string;
  bookNote: string;
  attributionPreference: string;
  finalNotes: string;
}

const STORAGE_KEY = 'm3_memory_wizard_draft';

const defaultState: MemoryWizardState = {
  memoryText: '',
  whereWe: '',
  aroundWhen: '',
  whoElse: '',
  whatMadeStick: '',
  dontRemember: '',
  encounterDate: '',
  isApproximateDate: false,
  locationName: '',
  eventName: '',
  mediaLink: '',
  mediaConsent: false,
  mediaFiles: [],
  submitterName: '',
  contact: '',
  bookNote: '',
  attributionPreference: 'anonymous',
  finalNotes: '',
};

export function useMemoryWizard() {
  const [state, setState] = useState<MemoryWizardState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...prev, ...parsed, mediaFiles: [] }));
      }
    } catch (e) {
      console.warn('Failed to load wizard draft:', e);
    }
    setIsLoaded(true);
  }, []);

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const toStore = {
        memoryText: state.memoryText,
        whereWe: state.whereWe,
        aroundWhen: state.aroundWhen,
        whoElse: state.whoElse,
        whatMadeStick: state.whatMadeStick,
        dontRemember: state.dontRemember,
        encounterDate: state.encounterDate,
        isApproximateDate: state.isApproximateDate,
        locationName: state.locationName,
        eventName: state.eventName,
        mediaLink: state.mediaLink,
        mediaConsent: state.mediaConsent,
        submitterName: state.submitterName,
        contact: state.contact,
        bookNote: state.bookNote,
        attributionPreference: state.attributionPreference,
        finalNotes: state.finalNotes,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to save wizard draft:', e);
    }
  }, [state, isLoaded]);

  const updateField = useCallback((field: keyof MemoryWizardState, value: any) => {
    setState(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateMultiple = useCallback((updates: Partial<MemoryWizardState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const addMediaFile = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, file]
    }));
  }, []);

  const removeMediaFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  }, []);

  const clearMediaFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      mediaFiles: []
    }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear wizard draft:', e);
    }
  }, []);

  return {
    state,
    isLoaded,
    updateField,
    updateMultiple,
    addMediaFile,
    removeMediaFile,
    clearMediaFiles,
    reset,
  };
}
