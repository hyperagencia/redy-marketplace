import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/utils';
import { validateRut, formatRut } from '@/lib/utils/rut';

// Modelo de comisión de REDY: 15% para la plataforma, 85% para el vendedor.
const COMMISSION_RATE = 0.15;
const commission = (price: number) => Math.round(price * COMMISSION_RATE);
const vendorAmount = (price: number) => price - commission(price);

describe('comisión 15/85', () => {
  it('calcula comisión y monto del vendedor', () => {
    expect(commission(66000)).toBe(9900);
    expect(vendorAmount(66000)).toBe(56100);
    expect(commission(85000)).toBe(12750);
    expect(vendorAmount(85000)).toBe(72250);
  });

  it('comisión + monto vendedor == precio (sin perder pesos)', () => {
    for (const p of [66000, 80990, 85000, 1, 999, 123457]) {
      expect(commission(p) + vendorAmount(p)).toBe(p);
    }
  });
});

describe('formatPrice (CLP)', () => {
  it('formatea sin decimales y con separador de miles', () => {
    // Intl usa el símbolo y separador de es-CL; normalizamos para comparar dígitos.
    const s = formatPrice(66000).replace(/\s/g, '');
    expect(s).toContain('66.000');
    expect(s).not.toContain(',');
  });
});

describe('validateRut', () => {
  it('acepta un RUT válido con dígito verificador correcto', () => {
    expect(validateRut('11.111.111-1')).toBe(true);
  });

  it('rechaza un RUT con dígito verificador incorrecto', () => {
    expect(validateRut('11.111.111-2')).toBe(false);
  });

  it('acepta 12.345.678-5 (DV correcto) formateado o sin formato', () => {
    expect(validateRut('12.345.678-5')).toBe(true);
    expect(validateRut('123456785')).toBe(true);
  });

  it('rechaza entradas demasiado cortas o con cuerpo no numérico', () => {
    expect(validateRut('1')).toBe(false);
    expect(validateRut('abc-1')).toBe(false);
  });
});

describe('formatRut', () => {
  it('normaliza a formato con puntos y guion', () => {
    expect(formatRut('111111111')).toBe('11.111.111-1');
    expect(formatRut('123456785')).toBe('12.345.678-5');
  });
});
