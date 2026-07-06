"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY || posthog.__loaded) return;
    posthog.init(POSTHOG_KEY, {
      // Reverse proxy vía rewrites de Next para esquivar adblockers.
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
      capture_pageview: false, // lo hacemos manual (App Router)
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, []);

  // Si no hay key, no montamos el provider (todo queda no-op).
  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <IdentifyTracker />
      {children}
    </PHProvider>
  );
}

function PageviewTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog || !pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthog]);

  return null;
}

function IdentifyTracker() {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) posthog.identify(user.id, { email: user.email });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else {
        posthog.reset();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [posthog]);

  return null;
}
