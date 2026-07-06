"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/**
 * Dispara un evento de analítica una vez al montar. Útil para instrumentar
 * páginas que son Server Components (ej. `product_viewed` en el detalle).
 */
export default function TrackEvent({
  event,
  properties,
}: {
  event: AnalyticsEventName;
  properties?: Record<string, any>;
}) {
  const posthog = usePostHog();
  const fired = useRef(false);

  useEffect(() => {
    if (!posthog || fired.current) return;
    fired.current = true;
    posthog.capture(event, properties);
  }, [posthog, event, properties]);

  return null;
}
