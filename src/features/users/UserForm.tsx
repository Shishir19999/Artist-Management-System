"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectField, TextField } from "@/components/ui/Fields";
import { useAuth } from "@/lib/client/auth";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { UserDTO } from "@/lib/domain/types";
import { ROLES } from "@/lib/roles";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

export function validateUser(f: { name: string; email: string; password: string }, editing: boolean) {
    const e: Partial<Record<"name" | "email" | "password", string>> = {};
    if (f.name.trim().length < 3) e.name = "Minimum 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email address";
    if (!editing && f.password.length < 3) e.password = "Minimum 3 characters";
    if (editing && f.password && f.password.length < 3) e.password = "Minimum 3 characters";
    return e;
}

export default function UserForm({ user }: { user?: UserDTO }) {
    const router = useRouter();
    const { user: me } = useAuth();
    const editing = Boolean(user);
    const self = user?.id === me?.id;
    const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", password: "", role: user?.role ?? "USER" });
    const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
    const [saving, setSaving] = useState(false);

    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setF((p) => ({ ...p, [k]: e.target.value }));
        setErrors((p) => ({ ...p, [k]: undefined }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validateUser(f, editing);
        setErrors(found);
        if (Object.keys(found).length) return;
        setSaving(true);
        try {
            const body = { name: f.name.trim(), email: f.email.trim(), role: f.role, ...(f.password ? { password: f.password } : {}) };
            if (editing) await axios.put(`/api/users/${user!.id}`, body);
            else await axios.post("/api/users", body);
            invalidate();
            showSucces(editing ? "User updated" : "User created");
            router.push(routes.users);
        } catch (err) {
            showError(handleError(err));
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="surface flex max-w-2xl flex-col gap-4 p-5 sm:p-6">
            <TextField label="Name" value={f.name} onChange={set("name")} error={errors.name} required autoComplete="off" />
            <TextField label="Email" type="email" value={f.email} onChange={set("email")} error={errors.email} required autoComplete="off" placeholder="you@example.com" />
            <TextField
                label={editing ? "New password" : "Password"}
                type="password"
                value={f.password}
                onChange={set("password")}
                error={errors.password}
                required={!editing}
                autoComplete="new-password"
                hint={editing ? "Leave empty to keep the current password" : undefined}
            />
            <SelectField label="Role" value={f.role} onChange={set("role")} disabled={self} hint={self ? "You cannot change your own role" : undefined}>
                {ROLES.map((r) => (
                    <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                    </option>
                ))}
            </SelectField>
            <div className="flex flex-wrap justify-end gap-2">
                <Link href={routes.users} className="btn btn-ghost">
                    Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving" : editing ? "Save changes" : "Create user"}
                </button>
            </div>
        </form>
    );
}
