import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout userRole="admin">
      {children}
    </UnifiedLayout>
  );
}