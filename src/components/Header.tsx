'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignedIn, UserButton, SignedOut, SignInButton } from '@clerk/nextjs'

function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Q&A Platform
          </Link>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/">
                  <Button variant="ghost">Home</Button>
                </Link>
              </li>
              <li>
                <Link href="/qa">
                  <Button variant="ghost">Q&A</Button>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <Button variant="ghost">Pricing</Button>
                </Link>
              </li>
              <li>
                <Link href="/counter">
                  <Button variant="ghost">Counter</Button>
                </Link>
              </li>
              <li>
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              </li>

              <SignedIn>
                <li className="flex items-center">
                  <UserButton />
                </li>
              </SignedIn>
              <SignedOut>
                <li className="bg-black text-white font-bold rounded flex items-center px-2">
                  <SignInButton mode="modal" />
                </li>
              </SignedOut>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header