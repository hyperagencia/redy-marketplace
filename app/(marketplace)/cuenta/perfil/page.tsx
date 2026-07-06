import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileForm from "@/components/marketplace/account/ProfileForm";
import LogoutButton from "@/components/shared/LogoutButton";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/cuenta/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/cuenta" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" /> Volver a mis compras
          </Link>
          <LogoutButton />
        </div>
        <h1 className="text-3xl font-bold mb-2">Mi perfil</h1>
        <p className="text-gray-600 mb-8">Tus datos y dirección para tus compras.</p>
        <ProfileForm profile={profile} email={user.email || ""} />
      </div>
    </main>
  );
}
