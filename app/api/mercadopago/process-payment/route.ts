import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { captureServer } from '@/lib/posthog/server';
import { AnalyticsEvent } from '@/lib/analytics/events';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

const payment = new Payment(client);

const COMMISSION_RATE = 0.15; // REDY cobra 15%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, paymentData } = body;

    // 1. Validar entrada
    if (!Array.isArray(items) || items.length === 0 || !shipping || !paymentData) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // 2. Autenticar al comprador desde la sesión (no confiar en el cliente)
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 3. Cliente privilegiado para crear orden y mover stock (bypassa RLS)
    const supabase = createServiceClient();

    // 4. Recalcular TODO en el servidor desde la DB (integridad de precio)
    const productIds: string[] = items.map((i: any) => i.product_id);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, stock, vendor_id, approval_status')
      .in('id', productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Uno o más productos no existen' },
        { status: 400 }
      );
    }

    // Validar disponibilidad y estado
    const unavailable = products.filter(
      (p) => p.approval_status !== 'approved' || (p.stock ?? 0) <= 0
    );
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Productos no disponibles: ${unavailable
            .map((p) => p.name)
            .join(', ')}`,
        },
        { status: 409 }
      );
    }

    // Un solo vendedor por orden
    const vendorIds = [...new Set(products.map((p) => p.vendor_id))];
    if (vendorIds.length > 1) {
      return NextResponse.json(
        { success: false, error: 'La orden debe ser de un solo vendedor' },
        { status: 400 }
      );
    }
    const vendorId = vendorIds[0];

    // Montos calculados en el servidor
    const orderItemsData = products.map((p) => {
      const price = Number(p.price);
      const commissionAmount = Math.round(price * COMMISSION_RATE);
      return {
        product_id: p.id,
        vendor_id: p.vendor_id,
        price,
        commission_amount: commissionAmount,
        vendor_amount: price - commissionAmount,
      };
    });

    const subtotal = orderItemsData.reduce((s, i) => s + i.price, 0);
    const commissionTotal = orderItemsData.reduce(
      (s, i) => s + i.commission_amount,
      0
    );
    const total = subtotal;

    // 5. Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        vendor_id: vendorId,
        subtotal,
        commission_total: commissionTotal,
        total,
        status: 'pending',
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_region: shipping.region,
        shipping_phone: shipping.phone,
        buyer_rut: shipping.rut,
        buyer_notes: shipping.notes,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creando orden:', orderError);
      return NextResponse.json(
        { success: false, error: 'No se pudo crear la orden' },
        { status: 500 }
      );
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map((i) => ({ ...i, order_id: order.id }))
    );

    if (itemsError) {
      console.error('Error creando order_items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'No se pudo crear el detalle de la orden' },
        { status: 500 }
      );
    }

    // 6. Cobrar en MercadoPago con el total del servidor
    const paymentBody: any = {
      transaction_amount: total,
      description: `Compra REDY - Orden #${order.id.slice(0, 8)}`,
      payment_method_id: paymentData.payment_method_id,
      payer: {
        email: paymentData.email || paymentData.payer?.email,
      },
    };

    if (paymentData.token) paymentBody.token = paymentData.token;
    if (paymentData.installments)
      paymentBody.installments = Number(paymentData.installments);
    if (paymentData.issuer_id) paymentBody.issuer_id = paymentData.issuer_id;

    if (paymentData.rut) {
      paymentBody.payer.identification = {
        type: 'RUT',
        number: String(paymentData.rut).replace(/\./g, '').replace(/-/g, ''),
      };
    } else if (paymentData.payer?.identification) {
      paymentBody.payer.identification = paymentData.payer.identification;
    }

    // Bypass de PRUEBA: simula un pago aprobado sin llamar a MercadoPago.
    // Doble candado: solo si NEXT_PUBLIC_MP_TEST_BYPASS=1 Y las credenciales son TEST.
    // Sirve para verificar el flujo end-to-end mientras el sandbox de MP no responde.
    const testBypass =
      process.env.NEXT_PUBLIC_MP_TEST_BYPASS === '1' &&
      (process.env.MERCADOPAGO_ACCESS_TOKEN || '').startsWith('TEST-');

    const paymentResponse: any = testBypass
      ? {
          status: 'approved',
          id: `TEST-${Date.now()}`,
          payment_method_id: paymentData.payment_method_id || 'test',
        }
      : await payment.create({ body: paymentBody });

    // 7. Reflejar el resultado del pago
    if (paymentResponse.status === 'approved') {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: paymentResponse.id?.toString(),
          payment_status: paymentResponse.status,
        })
        .eq('id', order.id);

      // Registrar la transacción (escrow: dinero retenido)
      const { error: txError } = await supabase.from('transactions').insert({
        order_id: order.id,
        vendor_id: vendorId,
        amount: subtotal,
        commission: commissionTotal,
        total,
        status: 'held',
        mercadopago_payment_id: paymentResponse.id?.toString(),
        mercadopago_status: paymentResponse.status,
      });
      if (txError) console.error('Error creando transacción:', txError);

      await captureServer(user.id, AnalyticsEvent.PaymentApproved, {
        order_id: order.id,
        vendor_id: vendorId,
        total,
        commission_total: commissionTotal,
        item_count: orderItemsData.length,
      });

      // Descontar stock (guardado: solo si sigue disponible)
      await Promise.all(
        products.map((p) =>
          supabase
            .from('products')
            .update({ stock: (p.stock ?? 1) - 1 })
            .eq('id', p.id)
            .gt('stock', 0)
        )
      );

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentId: paymentResponse.id,
        status: paymentResponse.status,
      });
    }

    if (paymentResponse.status === 'pending' || paymentResponse.status === 'in_process') {
      // La orden queda 'pending' hasta reconciliar (webhook pendiente de implementar)
      await supabase
        .from('orders')
        .update({
          payment_id: paymentResponse.id?.toString(),
          payment_status: paymentResponse.status,
        })
        .eq('id', order.id);

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentId: paymentResponse.id,
        status: paymentResponse.status,
        message: 'Pago pendiente de confirmación',
      });
    }

    // Rechazado: cancelar la orden
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_id: paymentResponse.id?.toString(),
        payment_status: paymentResponse.status,
      })
      .eq('id', order.id);

    await captureServer(user.id, AnalyticsEvent.PaymentRejected, {
      order_id: order.id,
      vendor_id: vendorId,
      total,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
    });

    return NextResponse.json({
      success: false,
      error: 'Pago rechazado',
      status: paymentResponse.status,
      statusDetail: paymentResponse.status_detail,
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
