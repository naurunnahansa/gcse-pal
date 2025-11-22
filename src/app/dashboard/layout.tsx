import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()

  return (
    <UnifiedLayout userRole={role}>
      {children}
    </UnifiedLayout>
  )
}
