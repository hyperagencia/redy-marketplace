'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const navItems = [
  { label: 'Somos', href: '#somos' },
  { label: '¿Cómo funciona?', href: '#como-funciona' },
  { label: '¿Por qué comprar?', href: '#por-que-comprar' },
  { label: '¿Por qué vender?', href: '#por-que-vender' },
]

export default function LandingNavbar() {
  const [isLight, setIsLight] = useState(false) // true = navbar claro, false = navbar oscuro

  useEffect(() => {
    // IDs de secciones con fondo claro (navbar debe ser claro)
    const lightSections = ['hero','test-lima', 'newsletter', 'por-que-comprar']

    // IDs de secciones con fondo oscuro (navbar debe ser oscuro)
    const darkSections = ['somos', 'como-funciona', 'por-que-vender']

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -50% 0px', // Detecta cuando la sección está en el top
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id

          if (lightSections.includes(sectionId)) {
            setIsLight(true) // Navbar claro
          } else if (darkSections.includes(sectionId)) {
            setIsLight(false) // Navbar oscuro
          }
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observar todas las secciones
    const allSectionIds = [...lightSections, ...darkSections]
    allSectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const handleCTAClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const newsletterSection = document.getElementById('newsletter')
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isLight
          ? 'bg-white/80 text-redy-dark'
          : 'bg-redy-dark/80 text-white'
      } backdrop-blur-md`}
    >
      <div className="container mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={isLight ? '/assets/images/redy-logo.svg' : '/assets/images/redy-logo-light.svg'}
            alt="REDY"
            width={100}
            height={40}
            className="h-10 w-auto transition-opacity duration-500"
            priority
          />
        </Link>

        {/* Nav Items */}
        <ul className="hidden md:flex items-center gap-8 font-aktiv font-medium">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="hover:opacity-70 transition-opacity duration-200"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={handleCTAClick}
          className="bg-redy-lima text-redy-dark font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity duration-200"
        >
          Inscríbete acá
        </button>
      </div>
    </nav>
  )
}
