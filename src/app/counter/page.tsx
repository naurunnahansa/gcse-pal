import { auth } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'
import CounterComponent from './CounterComponent'
import Header from '@/components/Header'

export default async function CounterPage() {
  const { has } = await auth()
  const hasProPlan = has({ plan: 'pro' })

  if (!hasProPlan) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Premium Content</h1>
              <p className="text-gray-600 mb-8">
                Only subscribers to the Pro plan can access this exclusive counter feature.
              </p>
              <Button asChild>
                <a href="/pricing">Upgrade to Pro Plan</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <CounterComponent />
      </main>
    </div>
  )
}