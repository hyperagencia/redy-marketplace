import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegistroVendedorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 py-12">
      <Suspense fallback={<div className="text-gray-500">Cargando…</div>}>
        <RegisterForm role="seller" />
      </Suspense>
    </div>
  );
}
