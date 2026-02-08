import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, subscribed_at: new Date().toISOString() }])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error newsletter:', error)
    return NextResponse.json(
      { error: 'Error al suscribirse' },
      { status: 500 }
    )
  }
}
