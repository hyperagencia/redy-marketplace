import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * El comprador presenta un reclamo sobre una compra. Queda visible para el
 * vendedor y el admin (alerta). Notificaciones por email: pendiente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason, description } = await request.json();

    if (!reason || !String(reason).trim()) {
      return NextResponse.json({ error: 'Indica el motivo del reclamo' }, { status: 400 });
    }

    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, buyer_id, vendor_id, status')
      .eq('id', id)
      .single();

    if (!order || order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    if (!['paid', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { error: 'No se puede reclamar esta compra' },
        { status: 409 }
      );
    }

    // Un reclamo abierto por orden
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('order_id', order.id)
      .in('status', ['open', 'in_review'])
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Ya tienes un reclamo abierto para esta compra' }, { status: 409 });
    }

    const { error: insErr } = await supabase.from('claims').insert({
      order_id: order.id,
      buyer_id: user.id,
      vendor_id: order.vendor_id,
      reason: String(reason).trim(),
      description: description || null,
      status: 'open',
    });
    if (insErr) throw insErr;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('claim error:', error);
    return NextResponse.json({ error: error.message || 'Error al reclamar' }, { status: 500 });
  }
}
