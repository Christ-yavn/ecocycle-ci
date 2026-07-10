import { RoleDashboardLayout } from "@/components/shell/RoleDashboardLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleDashboardLayout role="mairie">{children}</RoleDashboardLayout>;
}
