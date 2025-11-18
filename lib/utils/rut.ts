export function formatRut(rut: string): string {
  // Eliminar puntos y guiones
  const cleaned = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Si no tiene contenido, retornar vacío
  if (!cleaned) return '';
  
  // Separar número y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  
  // Formatear con puntos
  let formatted = '';
  let count = 0;
  
  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted;
    count++;
    if (count === 3 && i !== 0) {
      formatted = '.' + formatted;
      count = 0;
    }
  }
  
  return `${formatted}-${dv}`;
}

export function validateRut(rut: string): boolean {
  // Eliminar puntos y guión
  const cleaned = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (cleaned.length < 2) return false;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  
  // Validar que el cuerpo sea numérico
  if (!/^\d+$/.test(body)) return false;
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dv === calculatedDv;
}