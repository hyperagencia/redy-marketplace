import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/supabase/server';

/**
 * Marca como pagado el saldo pendiente de un vendedor: todas las transacciones
 * `released` sin `paid_out_at` pasan a pagadas (admin registró la transferencia).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('transactions')
    .update({ paid_out_at: new Date().toISOString() })
    .eq('vendor_id', id)
    .eq('status', 'released')
    .is('paid_out_at', null)
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, paid: data?.length || 0 });
}
