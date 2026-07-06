/**
 * Mock reutilizable del cliente de Supabase para tests de route handlers.
 *
 * `responses` mapea `"<tabla>.<op>"` (op ∈ select|insert|update|delete) a un
 * resultado `{ data, error }` (o una función que lo devuelva). El builder es
 * encadenable (.select/.eq/.in/.gt/.order/.limit) y termina con .single(),
 * .maybeSingle() o al ser "await"-eado (thenable).
 *
 * `calls.inserts` / `calls.updates` registran los payloads para poder aserverlos.
 */
export interface SupabaseMock {
  client: any;
  calls: {
    inserts: { table: string; payload: any }[];
    updates: { table: string; payload: any }[];
  };
}

type Resp = { data?: any; error?: any };
type RespMap = Record<string, Resp | (() => Resp)>;

export function createSupabaseMock(responses: RespMap = {}): SupabaseMock {
  const calls = { inserts: [] as any[], updates: [] as any[] };

  function builder(table: string) {
    let op: 'select' | 'insert' | 'update' | 'delete' = 'select';

    const resolve = (): Resp => {
      const entry = responses[`${table}.${op}`];
      const val = typeof entry === 'function' ? entry() : entry;
      return val ?? { data: null, error: null };
    };

    const b: any = {
      select: () => b,
      insert: (payload: any) => {
        op = 'insert';
        calls.inserts.push({ table, payload });
        return b;
      },
      update: (payload: any) => {
        op = 'update';
        calls.updates.push({ table, payload });
        return b;
      },
      delete: () => {
        op = 'delete';
        return b;
      },
      eq: () => b,
      neq: () => b,
      is: () => b,
      in: () => b,
      gt: () => b,
      lt: () => b,
      gte: () => b,
      lte: () => b,
      order: () => b,
      limit: () => b,
      single: () => Promise.resolve(resolve()),
      maybeSingle: () => Promise.resolve(resolve()),
      then: (onFulfilled: any, onRejected: any) =>
        Promise.resolve(resolve()).then(onFulfilled, onRejected),
    };
    return b;
  }

  return {
    client: { from: (table: string) => builder(table) },
    calls,
  };
}

/** Cliente de auth con un usuario (o null para simular no autenticado). */
export function createAuthMock(userId: string | null) {
  return {
    auth: {
      getUser: async () => ({
        data: { user: userId ? { id: userId, email: 'buyer@test.cl' } : null },
      }),
    },
  };
}
