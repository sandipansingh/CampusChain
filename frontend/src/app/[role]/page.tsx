import { redirect } from "next/navigation";

interface RolePageProps {
  params: Promise<{ role: string }>;
}

export default async function RolePage({ params }: RolePageProps) {
  const { role } = await params;
  const defaultSlug =
    role === "university" || role === "platform"
      ? "overview"
      : "dashboard";
  redirect(`/${role}/${defaultSlug}`);
}
