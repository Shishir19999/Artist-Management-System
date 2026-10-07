"use client";
import axios from "axios";
import { useState } from "react";
import { LuMoon, LuRotateCcw, LuSun } from "react-icons/lu";
import { resetTour } from "@/components/shell/OnboardingTour";
import { SelectField, TextField } from "@/components/ui/Fields";
import ImagePicker from "@/components/ui/ImagePicker";
import { ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/hooks";
import { IS_DEMO } from "@/lib/client/mode";
import { setTheme, useTheme } from "@/lib/client/theme";
import { invalidate } from "@/lib/client/use-api";
import { GENDERS, ROLE_LABEL } from "@/lib/domain/constants";
import type { UserDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showInfo, showSucces } from "@/utils/notify";

function ProfileForm({ me }: { me: UserDTO }) {
    const auth = useAuth();
    const [name, setName] = useState(me.name ?? "");
    const [gender, setGender] = useState<string>(me.gender);
    const [phone, setPhone] = useState(me.phone ?? "");
    const [address, setAddress] = useState(me.address ?? "");
    const [birthDate, setBirthDate] = useState(me.birthDate ? me.birthDate.slice(0, 10) : "");
    const [image, setImage] = useState<string | null>(me.image);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found: Record<string, string> = {};
        if (name.trim().length < 2) found.name = "Name must be at least 2 characters";
        if (next && next.length < 8) found.next = "Password must be at least 8 characters";
        if (next && !current) found.current = "Enter your current password to set a new one";
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        try {
            const res = await axios.put("/api/me", {
                name: name.trim(),
                gender,
                phone: phone.trim() || null,
                address: address.trim() || null,
                birthDate: birthDate || null,
                image,
                ...(next ? { currentPassword: current, newPassword: next } : {}),
            });
            invalidate();
            if (res.data.signOut) {
                showSucces("Password changed. Please sign in again.");
                await auth.signOut();
                return;
            }
            showSucces("Profile saved");
            setCurrent("");
            setNext("");
        } catch (err) {
            showError(handleError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="surface flex flex-col gap-6 p-5 sm:p-6">
            <ImagePicker label="Profile photo" name={name || "You"} value={image} onChange={setImage} />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required autoComplete="name" />
                <TextField label="Email" value={me.email ?? ""} readOnly hint="Email cannot be changed here" />
                <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                    {GENDERS.map((g) => (
                        <option key={g} value={g}>
                            {g.charAt(0) + g.slice(1).toLowerCase()}
                        </option>
                    ))}
                </SelectField>
                <TextField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                <TextField label="Date of birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} autoComplete="bday" />
                <TextField label="Role" value={ROLE_LABEL[me.role]} readOnly hint="Only an Artist Manager can change roles" />
            </div>
            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-base font-semibold">Change password</legend>
                <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} autoComplete="current-password" />
                <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} autoComplete="new-password" hint="At least 8 characters" />
            </fieldset>
            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "Saving" : "Save profile"}
                </button>
            </div>
        </form>
    );
}

export default function ProfilePage() {
    const { me, loading, error, reload } = useMe();
    const { user } = useAuth();
    const theme = useTheme();

    return (
        <>
            <PageHeader title="Settings" subtitle="Your profile and preferences." />
            {loading ? (
                <SkeletonRows rows={5} />
            ) : error || !me ? (
                <ErrorState message={error ?? "Could not load your profile"} onRetry={reload} />
            ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ProfileForm key={`${me.id}-${me.name}-${me.image?.length ?? 0}`} me={me} />
                    </div>
                    <div className="flex h-fit flex-col gap-5">
                        <section className="surface p-5" aria-label="Appearance">
                            <h2 className="mb-3 text-base font-semibold">Appearance</h2>
                            <div className="flex gap-2">
                                <button type="button" className={`btn btn-sm gap-2 ${theme === "studio" ? "btn-primary" : "btn-outline"}`} aria-pressed={theme === "studio"} onClick={() => setTheme("studio")}>
                                    <LuSun aria-hidden /> Light
                                </button>
                                <button type="button" className={`btn btn-sm gap-2 ${theme === "studio-dark" ? "btn-primary" : "btn-outline"}`} aria-pressed={theme === "studio-dark"} onClick={() => setTheme("studio-dark")}>
                                    <LuMoon aria-hidden /> Dark
                                </button>
                            </div>
                        </section>
                        <section className="surface p-5" aria-label="Guided tour">
                            <h2 className="mb-1 text-base font-semibold">Guided tour</h2>
                            <p className="muted mb-3 text-sm">Bring the short introduction back. It appears as a small card above your page.</p>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm gap-2"
                                onClick={() => {
                                    if (user) resetTour(user.id);
                                    showInfo("The tour card is back on your pages");
                                }}
                            >
                                <LuRotateCcw aria-hidden /> Show the tour card
                            </button>
                        </section>
                        {IS_DEMO && (
                            <p className="muted text-xs">Live preview: your profile is stored only in this browser.</p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
