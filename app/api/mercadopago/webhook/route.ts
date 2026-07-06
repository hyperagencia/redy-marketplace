import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createServiceClient } from '@/lib/supabase/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const payment = new Payment(client);

const COMMISSION_RATE = 0.15;

/**
 * Webhook de MercadoPago. Reconcilia pagos asíncronos (pending -> approved/rejected).
 * MP notifica con { type:'payment', data:{ id } } (o via query ?type=payment&data.id=).
 * Siempre respondemos 200 para que MP no reintente en bucle; la fuente de verdad
 * es el pago consultado a MP, no el payload recibido.
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let type = url.searchParams.get('type') || url.searchParams.get('topic');
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    try {
      const body = await request.json();
      type = body?.type || body?.topic || type;
      paymentId = body?.data?.id?.toString() || paymentId;
    } catch {
      // sin body JSON (notificación por query params)
    }

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true });
    }

    // Consultar el pago real a MercadoPago
    const mpPayment = await payment.get({ id: paymentId });
    const status = mpPayment.status;

    const supabase = createServiceClient();

    // Ubicar la orden por su payment_id
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_id', paymentId.toString())
      .single();

    if (!order) {
      return NextResponse.json({ received: true });
    }

    if (status === 'approved') {
      // Idempotencia: si ya hay transacción, no reprocesar
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('order_id', order.id)
        .maybeSingle();

      if (!existingTx) {
        await supabase
          .from('orders')
          .update({ status: 'paid', payment_status: status })
          .eq('id', order.id);

        await supabase.from('transactions').insert({
          order_id: order.id,
          vendor_id: order.vendor_id,
          amount: order.subtotal,
          commission: order.commission_total,
          total: order.total,
          status: 'held',
          mercadopago_payment_id: paymentId.toString(),
          mercadopago_status: status,
        });

        // Descontar stock de los productos de la orden (decremento guardado)
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id, products(stock)')
          .eq('order_id', order.id);

        await Promise.all(
          (orderItems || []).map((it: any) => {
            const stock = it.products?.stock ?? 0;
            if (stock <= 0) return Promise.resolve();
            return supabase
              .from('products')
              .update({ stock: stock - 1 })
              .eq('id', it.product_id)
              .gt('stock', 0);
          })
        );
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      if (order.status !== 'paid') {
        await supabase
          .from('orders')
          .update({ status: 'cancelled', payment_status: status })
          .eq('id', order.id);
      }
    } else {
      // pending / in_process: solo reflejar el estado del pago
      await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // 200 igualmente para evitar reintentos en bucle de MP
    return NextResponse.json({ received: true });
  }
}
