'use client'

import { StickyCard002 } from './StickyCard002'

const sportsCards = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80', // Running
    alt: 'Running',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80', // Cycling
    alt: 'Ciclismo',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80', // Swimming
    alt: 'Natación',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80', // Triathlon
    alt: 'Triatlón',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80', // Outdoor
    alt: 'Outdoor',
  },
]

export default function HeroCards() {
  return (
    <div className="w-full">
      <StickyCard002
        cards={sportsCards}
        className="bg-redy-white"
        containerClassName="rounded-3xl"
        imageClassName="object-cover grayscale"
      />
    </div>
  )
}
