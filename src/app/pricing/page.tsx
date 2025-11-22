import { PricingTable } from '@clerk/nextjs'
import Header from '@/components/Header'

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-8">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <PricingTable />
        </div>
      </main>
    </div>
  )
}