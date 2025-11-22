import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected route matchers for different roles
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk-webhooks(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/dashboard/admin(.*)",
]);

const isTeacherRoute = createRouteMatcher([
  "/dashboard/teacher(.*)",
  "/dashboard/admin/courses(.*)", // Teachers can manage courses
  "/dashboard/admin/chapters(.*)",
  "/dashboard/admin/pages(.*)",
]);

const isStudentRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/courses(.*)",
  "/learning(.*)",
]);

const isProRoute = createRouteMatcher([
  "/courses/pro(.*)",
  "/dashboard/pro(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role as string;

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin routes
  if (isAdminRoute(req) && userRole !== "admin") {
    // Teachers can access course management routes
    if (userRole === "teacher" && req.url.includes("/admin/courses")) {
      return NextResponse.next();
    }
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  // Check teacher routes
  if (isTeacherRoute(req) && !(userRole === "admin" || userRole === "teacher")) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  // Check pro-only routes
  if (isProRoute(req)) {
    if (!(userRole === "admin" || userRole === "teacher" || userRole === "pro_student")) {
      const url = new URL("/dashboard/upgrade", req.url);
      return NextResponse.redirect(url);
    }
  }

  // Default: allow authenticated users to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};