"use client";

import { APIError } from '@/lib/api/client';
import { useState } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof APIError) {
      setError(err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unknown error occurred. Please try again later.");
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
} 