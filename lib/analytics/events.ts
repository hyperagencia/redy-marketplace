/**
 * Taxonomía central de eventos de analítica (PostHog).
 * Compartida entre cliente (posthog-js) y servidor (posthog-node) para que
 * los nombres no se desincronicen. Funnel objetivo:
 *   product_viewed → add_to_cart → checkout_started → payment_approved → order_delivered
 */
export const AnalyticsEvent = {
  // Descubrimiento / carrito (cliente)
  ProductViewed: 'product_viewed',
  AddToCart: 'add_to_cart',
  CheckoutStarted: 'checkout_started',
  PaymentSubmitted: 'payment_submitted',
  // Resultado del pago (servidor — ocurre en el route handler)
  PaymentApproved: 'payment_approved',
  PaymentRejected: 'payment_rejected',
  OrderDelivered: 'order_delivered',
  // Lado oferta
  ProductPublished: 'product_published',
  // Identidad
  SignedUp: 'user_signed_up',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
