"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analytics/events";

export default function RegisterForm({ role }: { role: "buyer" | "seller" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();
  const posthog = usePostHog();

  const isSeller = role === "seller";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;

      // Sin sesión post-signup = confirmación de email activada
      if (!authData.session) {
        setError(
          "Debes confirmar tu email antes de continuar. Revisa tu correo. (Si esto no debería pedirse, desactiva la confirmación de email en Supabase Auth.)"
        );
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, role })
          .eq("id", authData.user.id);
        if (profileError) throw profileError;

        posthog?.identify(authData.user.id, { email });
        posthog?.capture(AnalyticsEvent.SignedUp, { role });
      }

      if (redirect) router.push(redirect);
      else router.push(isSeller ? "/vendedor" : "/cuenta");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white">R</div>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">REDY</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          {isSeller ? "Crea tu cuenta de vendedor" : "Crea tu cuenta"}
        </h1>
        <p className="text-gray-600">
          {isSeller ? "Empieza a vender tu equipo deportivo en REDY" : "Únete para comprar en REDY"}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" disabled={loading} className={`w-full text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${isSeller ? "bg-gray-900 hover:bg-black" : "bg-blue-600 hover:bg-blue-700"}`}>
            {loading ? "Creando cuenta..." : isSeller ? "Crear cuenta de vendedor" : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link href={loginHref} className="text-blue-600 hover:text-blue-700 font-semibold">Inicia sesión</Link>
          </p>
          {isSeller ? (
            <p className="text-sm text-gray-600">
              ¿Quieres comprar?{" "}
              <Link href="/registro" className="text-blue-600 hover:text-blue-700 font-semibold">Regístrate como cliente</Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              ¿Quieres vender?{" "}
              <Link href="/registro/vendedor" className="text-blue-600 hover:text-blue-700 font-semibold">Regístrate como vendedor</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
