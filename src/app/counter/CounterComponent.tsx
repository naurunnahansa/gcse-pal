"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CounterComponent() {
  const [count, setCount] = useState(0)

  const increment = () => setCount(prev => prev + 1)
  const decrement = () => setCount(prev => prev - 1)
  const reset = () => setCount(0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Pro Counter Feature</CardTitle>
            <p className="text-center text-sm text-gray-600">
              Exclusive feature for Pro plan subscribers
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {count}
              </div>
              <p className="text-gray-600">
                Current counter value
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={decrement}
                variant="outline"
                size="lg"
              >
                -
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                size="lg"
              >
                Reset
              </Button>
              <Button
                onClick={increment}
                size="lg"
              >
                +
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Thank you for being a Pro subscriber!</p>
              <p>Enjoy this exclusive counter feature and many more benefits.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}