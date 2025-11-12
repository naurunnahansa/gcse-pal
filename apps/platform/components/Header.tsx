"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <span className="text-lg font-bold text-white">G</span>
            </div>
            <span className="text-xl font-bold">GCSEPal</span>
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="#pricing"
              className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              Pricing
            </a>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Admin
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Sign In
              </Link>
              <Button size="sm" className="bg-black hover:bg-gray-800 text-white" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;