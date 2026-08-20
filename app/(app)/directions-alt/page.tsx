import { redirect } from "next/navigation";

/**
 * The row-list layout that used to live here for side-by-side comparison (Figma node 127:1400)
 * is now the primary step-04 screen at /directions. This route redirects rather than
 * disappearing outright, so any existing links or bookmarks to /directions-alt still land on
 * the live screen instead of a 404.
 */
export default function DirectionsAltPage() {
  redirect("/directions");
}
