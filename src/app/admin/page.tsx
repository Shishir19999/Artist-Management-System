import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic";

// Server-side redirect (calling router.push during render is a React error).
export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/auth/login?callbackUrl=/admin");
    redirect(session.user.role === "USER" ? "/admin/artist" : "/admin/dashboard");
}
