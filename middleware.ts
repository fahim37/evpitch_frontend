// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If unauthenticated, redirect to /login with a toast message param
    if (!req.nextauth?.token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("message", "please-login");
      return NextResponse.redirect(url);
    }
  },
  {
    callbacks: {
      // This ensures only authenticated users can access the matcher routes
      authorized: ({ token }) => !!token,
    },
  }
);

// List of routes to protect
export const config = {
  matcher: ["/elevator-video-pitch/:path*", "/jobs/:path*"],
};
