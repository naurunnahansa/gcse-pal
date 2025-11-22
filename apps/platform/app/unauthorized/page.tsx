import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="flex justify-center">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>If you need help, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  )
}