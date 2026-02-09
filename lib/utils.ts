import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como precio en pesos chilenos (CLP)
 * @param amount - Cantidad a formatear
 * @returns String formateado como precio (ej: "$12.990")
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha en formato legible en español
 * @param date - Fecha a formatear (Date, string o timestamp)
 * @returns String formateado (ej: "8 de febrero de 2026")
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj)
}
