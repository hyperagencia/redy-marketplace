import { PostHog } from 'posthog-node';
import type { AnalyticsEventName } from '@/lib/analytics/events';

// Singleton de posthog-node. Se reutiliza entre invocaciones en un contenedor
// serverless "caliente". No-op si no hay key configurada.
let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Captura un evento desde el servidor (route handlers). Úsalo para eventos que
 * NO ocurren en el navegador: resultado del pago, entrega, etc.
 * `distinctId` debe ser el `user.id` de Supabase para unir con la sesión del cliente.
 */
export async function captureServer(
  distinctId: string,
  event: AnalyticsEventName,
  properties?: Record<string, any>
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({ distinctId, event, properties });
    await ph.flush();
  } catch (err) {
    // La analítica nunca debe romper el flujo de negocio.
    console.error('posthog captureServer error:', err);
  }
}
