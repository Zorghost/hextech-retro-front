'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function GoogleAnalyticsRouteTracker({ measurementId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasSentFirst = useRef(false);

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // gtag may not be available yet if the script hasn't loaded.
    if (typeof window.gtag !== 'function') return;

    // If we also configured `send_page_view: true`, avoid double-firing on first hydrate.
    if (!hasSentFirst.current) {
      hasSentFirst.current = true;
      return;
    }

    // Recommended SPA approach: re-run config with an updated page_path.
    window.gtag('config', measurementId, {
      page_path: url,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
