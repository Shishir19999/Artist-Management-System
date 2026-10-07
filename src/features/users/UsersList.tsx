"use client";
import axios from "axios";
import Link from "next/link";
import { LuEye, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Avatar } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { useUsers } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { UserDTO } from "@/lib/domain/types";
import { ROLES, type AppRole } from "@/lib/roles";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

export default function UsersList() {
    const { user: me } = useAuth();
    const { users, loading, error, reload } = useUsers(true);
    const confirm = useConfirm();

    const changeRole = async (u: UserDTO, role: AppRole) => {
        if (role === u.role) return;
        const ok = await confirm({
            title: `Change ${u.name ?? u.email}'s role?`,
            message: `${ROLE_LABEL[u.role]} becomes ${ROLE_LABEL[role]}. Their current sign-in sessions are ended.`,
            confirmLabel: "Change role",
        });
        if (!ok) {
            invalidate("/api/users");
            return;
        }
        try {
            await axios.put(`/api/users/${u.id}`, { name: u.name ?? u.email, email: u.email, role });
            invalidate();
            showSucces("Role updated");
        } catch (e) {
            showError(handleError(e));
            invalidate("/api/users");
        }
    };

    const remove = async (list: UserDTO[], clear?: () => void) => {
        const others = list.filter((u) => u.id !== me?.id);
        if (others.length === 0) return showError("You cannot delete your own account");
        const ok = await confirm({
            title: others.length === 1 ? `Delete ${others[0].name ?? others[0].email}?` : `Delete ${others.length} users?`,
            message: "Their playlists and favorites are removed. This cannot be undone.",
            confirmLabel: "Delete",
        });
        if (!ok) return;
        const results = await Promise.allSettled(others.map((u) => axios.delete(`/api/users/${u.id}`)));
        const failed = results.filter((r) => r.status === "rejected").length;
        invalidate();
        clear?.();
        if (failed) showError(`${failed} of ${others.length} could not be deleted`);
        else showSucces(others.length === 1 ? "User deleted" : `${others.length} users deleted`);
    };

    const columns: Column<UserDTO>[] = [
        {
            key: "name",
            header: "User",
            accessor: (u) => u.name,
            cell: (u) => (
                <Link href={routes.userShow(u.id)} className="flex min-w-44 items-center gap-3 font-medium hover:underline">
                    <Avatar name={u.name ?? u.email} src={u.image} size="sm" />
                    {u.name ?? "-"}
                    {u.id === me?.id && <span className="badge badge-primary badge-soft badge-sm">You</span>}
                </Link>
            ),
        },
        { key: "email", header: "Email", accessor: (u) => u.email },
        {
            key: "role",
            header: "Role",
            accessor: (u) => ROLE_LABEL[u.role],
            cell: (u) => (
                <select
                    className="select select-sm w-44"
                    aria-label={`Role for ${u.name ?? u.email}`}
                    value={u.role}
                    disabled={u.id === me?.id}
                    onChange={(e) => void changeRole(u, e.target.value as AppRole)}
                >
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                        </option>
                    ))}
                </select>
            ),
        },
        { key: "gender", header: "Gender", accessor: (u) => u.gender, hiddenByDefault: true },
    ];

    return (
        <>
            <PageHeader
                title="Users and roles"
                subtitle="Create accounts and decide what each person can do."
                actions={
                    <Link href={routes.userNew} className="btn btn-primary gap-2">
                        <LuPlus aria-hidden /> New user
                    </Link>
                }
            />
            <DataTable
                caption="Users"
                rows={users}
                columns={columns}
                getId={(u) => u.id}
                loading={loading}
                error={error}
                onRetry={reload}
                emptyTitle="No users"
                filters={[
                    {
                        key: "role",
                        label: "Role",
                        options: ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] })),
                        match: (u, v) => u.role === v,
                    },
                ]}
                selectable
                bulkActions={(sel, clear) => (
                    <button type="button" className="btn btn-error btn-sm gap-1.5" onClick={() => void remove(sel, clear)}>
                        <LuTrash2 aria-hidden /> Delete selected
                    </button>
                )}
                csvName="users"
                storageKey="users"
                initialSort={{ key: "name", dir: "asc" }}
                rowActions={(u) => (
                    <span className="inline-flex items-center gap-0.5">
                        <Link href={routes.userShow(u.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`View ${u.name ?? u.email}`}>
                            <LuEye aria-hidden />
                        </Link>
                        <Link href={routes.userEdit(u.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`Edit ${u.name ?? u.email}`}>
                            <LuPencil aria-hidden />
                        </Link>
                        <button type="button" className="btn btn-ghost btn-xs btn-circle text-error" aria-label={`Delete ${u.name ?? u.email}`} disabled={u.id === me?.id} onClick={() => void remove([u])}>
                            <LuTrash2 aria-hidden />
                        </button>
                    </span>
                )}
            />
        </>
    );
}
