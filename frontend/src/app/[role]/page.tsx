import { redirect } from "next/navigation";

export default function RolePage({ params }: { params: { role: string } }) {
  const defaultSlug =
    params.role === "university" || params.role === "platform"
      ? "overview"
      : "dashboard";
  redirect(`/${params.role}/${defaultSlug}`);
}
