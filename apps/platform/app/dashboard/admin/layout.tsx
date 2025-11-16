import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { AdminProtection } from "@/components/AdminProtection";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtection>
      <UnifiedLayout userRole="admin">
        {children}
      </UnifiedLayout>
    </AdminProtection>
  );
}