"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/0 supports-[backdrop-filter]:bg-background/0">
      <div className="container">
        <div className="flex h-20 items-center justify-center">
          <div className="flex items-center justify-between w-full max-w-2xl rounded-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border border-border/20 shadow-lg px-6 py-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary crayon-effect">
                <span className="text-lg font-bold text-primary-foreground">G</span>
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
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground crayon-effect" asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
