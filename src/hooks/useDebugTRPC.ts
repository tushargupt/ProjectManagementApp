// src/hooks/useDebugTRPC.ts
import { useState, useEffect, useRef } from 'react';

/**
 * This hook helps debug TRPC calls by logging their state transitions
 */
export function useDebugTRPC<T>(
  name: string, 
  data: T | undefined, 
  isLoading: boolean, 
  isError: boolean,
  error: any
) {
  const isFirstRender = useRef(true);
  const prevData = useRef<T | undefined>(undefined);
  const prevLoading = useRef(isLoading);
  const prevError = useRef(isError);

  useEffect(() => {
    // Skip first render to avoid noise
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevData.current = data;
      prevLoading.current = isLoading;
      prevError.current = isError;
      return;
    }

    // Log state changes
    if (prevLoading.current !== isLoading) {
      console.log(`[${name}] Loading state changed:`, isLoading);
    }

    if (prevError.current !== isError) {
      console.log(`[${name}] Error state changed:`, isError);
      if (isError && error) {
        console.error(`[${name}] Error details:`, error);
      }
    }

    if (prevData.current !== data) {
      console.log(`[${name}] Data updated:`, data);
    }

    // Update refs
    prevData.current = data;
    prevLoading.current = isLoading;
    prevError.current = isError;
  }, [name, data, isLoading, isError, error]);

  return null;
}