import HeroCards from '@/components/landing/HeroCards'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section con Cards */}
      <section
        id="hero"
        className="bg-redy-white pt-20"
      >
        <HeroCards />
      </section>

      {/* Somos - ¿Qué es REDY? */}
      <section
        id="somos"
        className="min-h-screen flex items-center justify-center bg-redy-red"
      >
        <h2 className="title-aktiv text-5xl text-white text-center">
          ¿QUÉ ES REDY?
        </h2>
      </section>

      {/* ¿Cómo funciona? */}
      <section
        id="como-funciona"
        className="min-h-screen flex items-center justify-center bg-redy-red"
      >
        <h2 className="title-aktiv text-5xl text-white text-center">
          ¿CÓMO FUNCIONA?
        </h2>
      </section>

      {/* ¿Por qué vender? */}
      <section
        id="por-que-vender"
        className="min-h-screen flex items-center justify-center bg-redy-dark"
      >
        <h2 className="title-aktiv text-5xl text-white text-center">
          ¿POR QUÉ VENDER?
        </h2>
      </section>

      {/* Test Lima (simula sección clara) */}
      <section
        id="test-lima"
        className="min-h-screen flex items-center justify-center bg-redy-lima"
      >
        <h2 className="title-aktiv text-5xl text-redy-dark text-center">
          SECCIÓN CLARA
        </h2>
      </section>

      {/* Newsletter Section */}
      <section
        id="newsletter"
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <h2 className="title-aktiv text-5xl text-redy-dark text-center">
          INSCRÍBETE
        </h2>
      </section>
    </main>
  )
}
