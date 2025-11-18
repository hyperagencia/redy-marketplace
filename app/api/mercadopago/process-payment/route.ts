import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@/lib/supabase/server';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  }
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== API RECEIVED ===');
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('===================');

    const { orderId, paymentData } = body;

    if (!orderId || !paymentData) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Order found:', order.id);

    // Preparar datos del pago para MercadoPago
const paymentBody: any = {
  transaction_amount: order.total, // Cambio: total en vez de total_amount
  description: `Compra REDY - Orden #${orderId.slice(0, 8)}`,
  payment_method_id: paymentData.payment_method_id,
  payer: {
    email: paymentData.email || paymentData.payer?.email,
  },
};

    // Agregar token si existe
    if (paymentData.token) {
      paymentBody.token = paymentData.token;
    }

    // Agregar installments si existe
    if (paymentData.installments) {
      paymentBody.installments = Number(paymentData.installments);
    }

    // Agregar issuer_id si existe
    if (paymentData.issuer_id) {
      paymentBody.issuer_id = paymentData.issuer_id;
    }

    // Agregar identificación con RUT
    if (paymentData.rut) {
      paymentBody.payer.identification = {
        type: 'RUT',
        number: paymentData.rut,
      };
    } else if (paymentData.payer?.identification) {
      paymentBody.payer.identification = paymentData.payer.identification;
    }

    console.log('📤 Creating payment in MercadoPago:', paymentBody);

    // Crear el pago en MercadoPago
    const paymentResponse = await payment.create({
      body: paymentBody,
    });

    console.log('📥 MercadoPago response:', paymentResponse);

    // Actualizar la orden con el resultado del pago
    if (paymentResponse.status === 'approved') {
      console.log('✅ Payment approved');

      // Pago aprobado
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: paymentResponse.id?.toString(),
          payment_status: paymentResponse.status,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      // Crear transacción
await supabase.from('transactions').insert({
  order_id: orderId,
  payment_id: paymentResponse.id?.toString(),
  amount: order.total, // Cambio: total en vez de total_amount
  status: 'completed',
  payment_method: paymentResponse.payment_method_id,
});

      return NextResponse.json({
        success: true,
        paymentId: paymentResponse.id,
        status: paymentResponse.status,
      });
    } else if (paymentResponse.status === 'pending') {
      console.log('⏳ Payment pending');

      // Pago pendiente
      await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          payment_id: paymentResponse.id?.toString(),
          payment_status: paymentResponse.status,
        })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        paymentId: paymentResponse.id,
        status: paymentResponse.status,
        message: 'Pago pendiente de confirmación',
      });
    } else {
      console.log('❌ Payment rejected:', paymentResponse.status);

      // Pago rechazado
      await supabase
        .from('orders')
        .update({
          status: 'payment_failed',
          payment_id: paymentResponse.id?.toString(),
          payment_status: paymentResponse.status,
        })
        .eq('id', orderId);

      return NextResponse.json({
        success: false,
        error: 'Pago rechazado',
        status: paymentResponse.status,
        statusDetail: paymentResponse.status_detail,
      });
    }
  } catch (error: any) {
    console.error('❌ Payment processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al procesar el pago',
      },
      { status: 500 }
    );
  }
}