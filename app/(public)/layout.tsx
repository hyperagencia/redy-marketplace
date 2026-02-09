import type { Metadata } from 'next'
import LandingNavbar from '@/components/landing/LandingNavbar'

export const metadata: Metadata = {
  title: 'REDY - Marketplace de Equipamiento Deportivo',
  description: 'Compra y vende equipamiento deportivo usado de calidad',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingNavbar />
      {children}
      {/* TODO: Agregar Footer después */}
    </>
  )
}
