"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRut, validateRut } from "@/lib/utils/rut";
import { Loader2, Check } from "lucide-react";

const REGIONS = [
  "Región Metropolitana", "Valparaíso", "Biobío", "Araucanía", "Los Lagos",
  "Antofagasta", "Coquimbo", "Maule", "O'Higgins", "Ñuble",
];

export default function ProfileForm({ profile, email }: { profile: any; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    rut: profile?.rut || "",
    phone: profile?.phone || "",
    region: profile?.region || "",
    city: profile?.city || "",
    address: profile?.address || "",
  });

  const set = (k: string, v: string) => {
    setForm({ ...form, [k]: v });
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.rut && !validateRut(form.rut)) return setError("RUT inválido");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
      if (error) throw error;
      setSaved(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <Field label="Email">
        <input value={email} disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
      </Field>
      <Field label="Nombre completo">
        <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="input" placeholder="Juan Pérez" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="RUT">
          <input value={form.rut} onChange={(e) => set("rut", formatRut(e.target.value))} className="input" placeholder="12.345.678-9" />
        </Field>
        <Field label="Teléfono">
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+56 9 1234 5678" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Región">
          <select value={form.region} onChange={(e) => set("region", e.target.value)} className="input">
            <option value="">Selecciona…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Ciudad">
          <input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" placeholder="Santiago" />
        </Field>
      </div>
      <Field label="Dirección">
        <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="Av. Providencia 1234, Depto 501" />
      </Field>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : null}
        {loading ? "Guardando…" : saved ? "Guardado" : "Guardar cambios"}
      </button>

      <style>{`.input{width:100%;padding:.75rem 1rem;border:1px solid #d1d5db;border-radius:.75rem;outline:none}.input:focus{border-color:#3b82f6}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
