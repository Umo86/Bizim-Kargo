import { redirect } from "next/navigation";

/** /admin has no content of its own — carriers is the default section. */
export default function AdminIndexPage() {
  redirect("/admin/carriers");
}
