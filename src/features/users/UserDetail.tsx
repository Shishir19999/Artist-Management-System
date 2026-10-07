"use client";
import Link from "next/link";
import { LuPencil } from "react-icons/lu";
import { Avatar } from "@/components/ui/Art";
import { BackLink, LoadState } from "@/components/ui/DetailGate";
import { EmptyState, PageHeader } from "@/components/ui/States";
import ActivityList from "@/features/activity/ActivityList";
import { useActivity } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { useApi } from "@/lib/client/use-api";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { UserDTO } from "@/lib/domain/types";
import UserForm from "./UserForm";

export function UserEdit({ id }: { id: string }) {
    const req = useApi<{ user: UserDTO }>(`/api/users/${id}`);
    const user = req.data?.user;
    if (!user) return <LoadState loading={req.loading} error={req.error ?? "User not found"} onRetry={req.reload} notFound="This user does not exist." />;
    return (
        <>
            <PageHeader back={<BackLink href={routes.users}>All users</BackLink>} title={`Edit ${user.name ?? user.email}`} />
            <UserForm key={`${user.id}-${user.role}-${user.name}`} user={user} />
        </>
    );
}

export default function UserDetail({ id }: { id: string }) {
    const req = useApi<{ user: UserDTO }>(`/api/users/${id}`);
    const { activity } = useActivity({ userId: id, limit: 20 });
    const user = req.data?.user;
    if (!user) return <LoadState loading={req.loading} error={req.error ?? "User not found"} onRetry={req.reload} notFound="This user does not exist." />;
    return (
        <>
            <PageHeader
                back={<BackLink href={routes.users}>All users</BackLink>}
                title={user.name ?? user.email ?? "User"}
                actions={
                    <Link href={routes.userEdit(user.id)} className="btn btn-outline gap-2">
                        <LuPencil aria-hidden /> Edit
                    </Link>
                }
            />
            <div className="grid gap-5 lg:grid-cols-3">
                <section className="surface flex items-center gap-4 p-5" aria-label="Account">
                    <Avatar name={user.name ?? user.email} src={user.image} size="lg" />
                    <dl className="min-w-0 text-sm">
                        <dt className="muted text-xs">Email</dt>
                        <dd className="mb-2 font-medium break-all">{user.email}</dd>
                        <dt className="muted text-xs">Role</dt>
                        <dd className="badge badge-primary badge-soft">{ROLE_LABEL[user.role]}</dd>
                    </dl>
                </section>
                <section className="surface p-5 lg:col-span-2" aria-label="Recent activity">
                    <h2 className="mb-2 text-base font-semibold">Recent activity</h2>
                    {activity.length === 0 ? <EmptyState title="No activity yet" /> : <ActivityList items={activity} />}
                </section>
            </div>
        </>
    );
}
