'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/toast/ToastProvider';
import { setToastFunction } from '@/lib/fetcher';

/**
 * Hook that connects the fetcher with the toast system
 * Must be used in a component wrapped with ToastProvider
 */
export function useFetcherToast() {
  const { addToast } = useToast();

  useEffect(() => {
    setToastFunction(addToast);
  }, [addToast]);
}
