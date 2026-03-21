export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/session/:path*",
    "/history/:path*",
    "/bookmarks/:path*",
    "/settings/:path*",
  ],
};
