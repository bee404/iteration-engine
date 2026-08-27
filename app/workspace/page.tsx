import { redirect } from "next/navigation";

/** Compatibility redirect for bookmarks from the retired single-page workspace. */
export default function WorkspacePage() {
  redirect("/upload");
}
