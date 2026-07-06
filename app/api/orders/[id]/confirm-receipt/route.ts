import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { captureServer } from '@/lib/posthog/server';
import { AnalyticsEvent } from '@/lib/analytics/events';

/**
 * El comprador confirma que recibió el producto.
 * Pasa la orden a 'delivered' y libera el escrow (transactions -> 'released').
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Autenticar al comprador
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // La orden debe ser del comprador y estar pagada
    const { data: order } = await supabase
      .from('orders')
      .select('id, buyer_id, status')
      .eq('id', id)
      .single();

    if (!order || order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: 'La orden no está en un estado que permita confirmar la recepción' },
        { status: 409 }
      );
    }

    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', order.id);

    // Liberar el escrow al vendedor
    await supabase
      .from('transactions')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('order_id', order.id)
      .eq('status', 'held');

    await captureServer(user.id, AnalyticsEvent.OrderDelivered, {
      order_id: order.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('confirm-receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al confirmar la recepción' },
      { status: 500 }
    );
  }
}
