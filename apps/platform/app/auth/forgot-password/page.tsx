"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // TODO: Implement actual password reset
      console.log("Sending password reset to:", email);
      // Mock successful password reset
      setTimeout(() => {
        setIsSubmitted(true);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        description="We've sent you instructions to reset your password"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Password Reset Email Sent</h3>
              <p className="text-sm text-muted-foreground">
                We've sent password reset instructions to:
              </p>
              <p className="font-medium text-foreground">{email}</p>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="mb-2">
                <strong>What's next?</strong>
              </p>
              <ol className="text-left space-y-1 text-muted-foreground">
                <li>1. Check your email inbox</li>
                <li>2. Click the reset link in the email</li>
                <li>3. Create a new secure password</li>
              </ol>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Didn't receive the email?</p>
              <ul className="text-left space-y-1">
                <li>• Check your spam folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
            >
              Try a different email address
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              asChild
            >
              <Link href="/auth/signin" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      description="Enter your email address and we'll send you instructions to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the email address associated with your GCSEPal account
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset instructions...
            </>
          ) : (
            "Send Reset Instructions"
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/auth/signin" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}