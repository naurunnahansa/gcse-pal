import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout userRole="student">
      {children}
    </UnifiedLayout>
  );
}