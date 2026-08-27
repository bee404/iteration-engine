import { redirect } from "next/navigation";

/** Compatibility redirect for the recap step removed from the canonical V0 path. */
export default function SynthesizedPage() {
  redirect("/directions");
}
