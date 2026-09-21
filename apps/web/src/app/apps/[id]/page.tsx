import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { AppRuntime } from "@/components/runtime/AppRuntime";

export default async function AppInstancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);

  return <AppRuntime appInstanceId={id} currentUserId={user.id} />;
}
