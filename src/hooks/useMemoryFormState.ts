"use client";

import { useEffect, useState } from "react";

export interface MemoryFormState {
  submitterName: string;
  contact: string;
  encounterDate: string;
  isApproximateDate: boolean;
  locationName: string;
  city: string;
  region: string;
  country: string;
  eventName: string;
  howMet: string;
  memoryText: string;
  beforeText: string;
  afterText: string;
  metAgain: string;
  peoplePresent: string;
  yerielWearing: string;
  submitterWearing: string;
  talkedAbout: string;
  exchanged: string;
  artifactInfo: string;
  forgottenPrompt: string;
  bookPagePrompt: string;
  additionalComments: string;
  mediaLink: string;
  mediaConsent: boolean;
}

const STORAGE_KEY = "m3_memory_form_state";

const defaultState: MemoryFormState = {
  submitterName: "",
  contact: "",
  encounterDate: "",
  isApproximateDate: false,
  locationName: "",
  city: "",
  region: "",
  country: "",
  eventName: "",
  howMet: "",
  memoryText: "",
  beforeText: "",
  afterText: "",
  metAgain: "",
  peoplePresent: "",
  yerielWearing: "",
  submitterWearing: "",
  talkedAbout: "",
  exchanged: "",
  artifactInfo: "",
  forgottenPrompt: "",
  bookPagePrompt: "",
  additionalComments: "",
  mediaLink: "",
  mediaConsent: false
};

export function useMemoryFormState() {
  const [state, setState] = useState<MemoryFormState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load form state from sessionStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to sessionStorage whenever state changes
  const updateState = (updates: Partial<MemoryFormState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn("Failed to save form state to sessionStorage:", error);
      }
      return next;
    });
  };

  // Clear form state (after successful submission)
  const clearState = () => {
    setState(defaultState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear form state from sessionStorage:", error);
    }
  };

  return { state, updateState, clearState, isLoaded };
}
