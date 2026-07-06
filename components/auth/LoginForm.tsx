"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (redirect) {
        router.push(redirect);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile?.role === "admin") router.push("/admin");
        else if (profile?.role === "seller") router.push("/vendedor");
        else router.push("/cuenta");
      }
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerHref = redirect ? `/registro?redirect=${encodeURIComponent(redirect)}` : "/registro";

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white">R</div>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">REDY</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Inicia sesión</h1>
        <p className="text-gray-600">
          {redirect ? "Inicia sesión para completar tu compra" : "Accede a tu cuenta de REDY"}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="tu@email.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <User className="w-5 h-5" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link href={registerHref} className="text-blue-600 hover:text-blue-700 font-semibold">Crea tu cuenta</Link>
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs text-gray-600 font-semibold mb-2">🧪 Credenciales de prueba:</p>
        <p className="text-xs text-gray-600">Cliente: <code className="bg-white px-2 py-1 rounded">cliente@redy.cl</code> · <code className="bg-white px-2 py-1 rounded">password123</code></p>
        <p className="text-xs text-gray-600 mt-1">Vendedor: <code className="bg-white px-2 py-1 rounded">vendedor1@redy.cl</code> · <code className="bg-white px-2 py-1 rounded">password123</code></p>
      </div>
    </div>
  );
}
