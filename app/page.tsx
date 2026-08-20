import { redirect } from "next/navigation";

/**
 * The Vercel app's bare root URL should drop straight into the first step of the Coquí workflow
 * (the upload/dropzone screen) rather than the old round-workspace landing page. Redirecting here
 * keeps "/" as the canonical entry point that every stale link/bookmark still resolves to, while
 * the actual flow lives at /upload.
 */
export default function HomePage() {
  redirect("/upload");
}

