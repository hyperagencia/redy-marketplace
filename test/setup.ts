// Setup global para los tests.
// Aseguramos que el bypass de prueba esté APAGADO para ejercitar la ruta real
// de MercadoPago en los tests de route handlers.
import { beforeEach } from 'vitest';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_MP_TEST_BYPASS;
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-xxx';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
});
