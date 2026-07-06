import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/supabase/server';

/** Bloquea o reactiva un vendedor (admin). Body: { blocked: boolean } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const { blocked } = await request.json();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ blocked: Boolean(blocked) })
    .eq('id', id)
    .eq('role', 'seller');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, blocked: Boolean(blocked) });
}
