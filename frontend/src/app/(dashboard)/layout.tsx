import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MainLayout } from "@/new_components/layout/MainLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the custom role from the users table
  const { data: userData } = await supabase
    .from("users")
    .select("role, first_name, last_name, phone_number")
    .eq("id", user.id)
    .single();

  const formattedUser = {
    id: user.id,
    full_name: userData?.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : user.phone || userData?.phone_number || 'Utilisateur',
    role: userData?.role || 'user',
  };

  return (
    <MainLayout user={formattedUser}>
      {children}
    </MainLayout>
  );
}
