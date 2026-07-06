import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-12">
      <Suspense fallback={<div className="text-gray-500">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
