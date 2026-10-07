"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { AppRole } from "@/lib/roles";

const KEY = (userId: string) => `ams-tour-done:${userId}`;

interface Step {
    title: string;
    body: string;
}

function stepsFor(role: AppRole): Step[] {
    const steps: Step[] = [
        {
            title: "Welcome to your workspace",
            body: `You are signed in as ${ROLE_LABEL[role]}. This short tour shows where things live. You can replay it from your account menu at any time.`,
        },
        {
            title: "Dashboard",
            body: "See artists by genre, songs per release year, your top artists, upcoming gigs and the latest activity on one screen.",
        },
    ];
    if (role === "USER") {
        steps.push({
            title: "Your artists and songs",
            body: "Browse the artists and songs shared with you. Sort, filter and search the tables, choose which columns to show and export what you see as CSV.",
        });
    } else {
        steps.push({
            title: "Artists and songs",
            body: "Add and edit artists with photos, bios and social links, manage their songs, and use the checkboxes for bulk actions. Import or export CSV from any table.",
        });
        steps.push({
            title: "Calendar",
            body: "Plan gigs and bookings per artist and see them on a month calendar. Confirmed, on hold, completed and cancelled dates have their own markers.",
        });
    }
    steps.push({
        title: "Playlists, favorites and previews",
        body: "Press play on any song for a short preview, build playlists, and tap the heart to keep favorites close.",
    });
    if (role === "ADMIN") {
        steps.push({
            title: "Users and roles",
            body: "Open Users to change roles, add accounts and review each person's audit trail. Role changes apply immediately.",
        });
    }
    steps.push({
        title: "Search from anywhere",
        body: "Press Ctrl+K (or Cmd+K), or use the search button in the top bar, to jump to any artist, song or playlist.",
    });
    return steps;
}

export function resetTour(userId: string) {
    try {
        localStorage.removeItem(KEY(userId));
    } catch {
        /* ignore */
    }
}

export default function OnboardingTour({
    userId,
    role,
    forceOpen,
    onClose,
}: {
    userId: string;
    role: AppRole;
    forceOpen: boolean;
    onClose: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const steps = stepsFor(role);

    useEffect(() => {
        let done = false;
        try {
            done = localStorage.getItem(KEY(userId)) === "1";
        } catch {
            done = true; // storage unavailable: do not nag on every page
        }
        if (!done || forceOpen) {
            const t = setTimeout(() => {
                setStep(0);
                setOpen(true);
            }, 600);
            return () => clearTimeout(t);
        }
    }, [userId, forceOpen]);

    const finish = () => {
        try {
            localStorage.setItem(KEY(userId), "1");
        } catch {
            /* ignore */
        }
        setOpen(false);
        onClose();
    };

    const last = step === steps.length - 1;
    const current = steps[step];

    return (
        <Modal
            open={open}
            onClose={finish}
            title={current.title}
            size="sm"
            footer={
                <>
                    <span className="muted mr-auto self-center text-xs" aria-live="polite">
                        Step {step + 1} of {steps.length}
                    </span>
                    {step > 0 ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    ) : (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
                            Skip
                        </button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => (last ? finish() : setStep(step + 1))}>
                        {last ? "Done" : "Next"}
                    </button>
                </>
            }
        >
            <p className="text-sm leading-relaxed">{current.body}</p>
        </Modal>
    );
}
