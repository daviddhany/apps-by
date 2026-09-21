import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { AppHeader } from "@/components/AppHeader";
import { FriendsClient, type FriendEntry } from "./FriendsClient";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await db.friendship.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    include: { requester: true, addressee: true },
    orderBy: { createdAt: "desc" },
  });

  const friends: FriendEntry[] = [];
  const incoming: FriendEntry[] = [];
  const outgoing: FriendEntry[] = [];
  for (const r of rows) {
    const other = r.requesterId === user.id ? r.addressee : r.requester;
    const entry: FriendEntry = { id: r.id, userId: other.id, name: other.name, email: other.email, createdAt: r.createdAt.toISOString() };
    if (r.status === "accepted") friends.push(entry);
    else if (r.status === "pending" && r.addresseeId === user.id) incoming.push(entry);
    else if (r.status === "pending" && r.requesterId === user.id) outgoing.push(entry);
  }

  return (
    <>
      <AppHeader title="Friends" showBack initial={user.name} />
      <main className="px-margin pb-space-xl pt-20">
        <FriendsClient initialFriends={friends} initialIncoming={incoming} initialOutgoing={outgoing} />
      </main>
    </>
  );
}
