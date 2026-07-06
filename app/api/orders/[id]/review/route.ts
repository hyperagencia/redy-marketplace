import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * El comprador puntúa al vendedor de una orden ya entregada.
 * Crea la review (una por orden) y recalcula `profiles.rating` del vendedor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rating, comment } = await request.json();

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating inválido (1 a 5)' }, { status: 400 });
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
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Solo puedes puntuar una compra recibida' },
        { status: 409 }
      );
    }

    const { error: insErr } = await supabase.from('reviews').insert({
      order_id: order.id,
      buyer_id: user.id,
      vendor_id: order.vendor_id,
      rating: r,
      comment: comment || null,
    });
    if (insErr) {
      // order_id es único → ya existe una review para esta orden
      if (insErr.code === '23505') {
        return NextResponse.json({ error: 'Ya puntuaste esta compra' }, { status: 409 });
      }
      throw insErr;
    }

    // Recalcular el rating promedio del vendedor
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('vendor_id', order.vendor_id);
    if (reviews && reviews.length) {
      const avg = reviews.reduce((s, x) => s + Number(x.rating), 0) / reviews.length;
      await supabase
        .from('profiles')
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq('id', order.vendor_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('review error:', error);
    return NextResponse.json({ error: error.message || 'Error al puntuar' }, { status: 500 });
  }
}
