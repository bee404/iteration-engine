import { redirect } from "next/navigation";

/**
 * The Vercel app's bare root URL should drop straight into the first step of the Coquí workflow
 * (the upload/dropzone screen). Redirecting here keeps "/" as the canonical entry point while
 * the actual flow lives at /upload.
 */
export default function HomePage() {
  redirect("/upload");
}
