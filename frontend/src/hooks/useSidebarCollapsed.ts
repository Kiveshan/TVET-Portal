import { useCallback, useState } from 'react';

const STORAGE_KEY = 'tvet-portal.sidebar-collapsed';

/** Below this width the sidebar starts collapsed, unless the user chose otherwise. */
const AUTO_COLLAPSE_WIDTH = 1024;

function readInitial(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch {
    // Storage can be blocked (private mode, site settings); fall back to the screen width.
  }
  return window.innerWidth < AUTO_COLLAPSE_WIDTH;
}

/** Collapsed/expanded state of the side navigation, remembered in this browser. */
export function useSidebarCollapsed(): [collapsed: boolean, toggle: () => void] {
  const [collapsed, setCollapsed] = useState(readInitial);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Not remembered, but the toggle still works for this visit.
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}
