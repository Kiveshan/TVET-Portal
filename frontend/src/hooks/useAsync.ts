import { useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  key: string | null;
  data?: T;
  error?: Error;
}

export interface AsyncResult<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Runs `load` whenever `key` changes (pass `null` to skip) and returns its result.
 * Results are tagged with their key, so a stale response never shows for a newer key.
 * With `keepPreviousData`, the last result stays visible while the next key loads
 * (e.g. paging a table without it flashing empty).
 */
export function useAsync<T>(
  key: string | null,
  load: () => Promise<T>,
  { keepPreviousData = false }: { keepPreviousData?: boolean } = {},
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ key: null });
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ key, data });
      },
      (error: Error) => {
        if (!cancelled) setState({ key, error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const isCurrent = key !== null && state.key === key;
  return {
    data: isCurrent || keepPreviousData ? state.data : undefined,
    error: isCurrent ? state.error : undefined,
    loading: key !== null && !isCurrent,
  };
}
