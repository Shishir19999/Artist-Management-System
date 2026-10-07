"use client";
import { useState } from "react";
import { LuCompass, LuX } from "react-icons/lu";
import Modal from "@/components/ui/Modal";
import { useLocalFlag, writeFlag } from "@/lib/client/local-flag";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { AppRole } from "@/lib/roles";

const tourKey = (userId: string) => `ams-tour:${userId}`;

interface Step {
    title: string;
    body: string;
}

export function stepsFor(role: AppRole): Step[] {
    const steps: Step[] = [
        {
            title: "Welcome",
            body: `You are signed in as ${ROLE_LABEL[role]}. This short tour shows where things live. You can replay it from your account menu at any time.`,
        },
        { title: "Dashboard", body: "Your starting point. The cards show what you can work with and open the matching page." },
    ];
    if (role === "ARTIST_MANAGER") {
        steps.push(
            { title: "Artists, Music and Users", body: "Add, edit and remove artists, their music and the people who use the workspace. Choose which role each user has." },
            { title: "Tables", body: "Search, sort and filter any list, pick the columns you want, select rows for bulk actions and export or import CSV files." },
            { title: "More", body: "Calendar plans gigs and bookings per artist. Activity shows who changed what." }
        );
    } else if (role === "ARTIST") {
        steps.push(
            { title: "My Profile", body: "Keep your biography, photo and links up to date. This is what everyone sees on your artist page." },
            { title: "Music", body: "Add and edit your own songs. You can browse everyone else's music, but only change yours." },
            { title: "More", body: "Calendar holds your gigs and bookings. Playlists collect songs you want to keep together." }
        );
    } else {
        steps.push(
            { title: "Music", body: "Browse all music, sort and filter the list and press play to hear a short preview." },
            { title: "More", body: "Tap the heart on a song to keep it in Favorites, and group songs into Playlists." }
        );
    }
    steps.push({ title: "Search from anywhere", body: "Press Ctrl+K (or Cmd+K), or use the Search button in the top bar, to jump straight to what you need." });
    return steps;
}

/**
 * A small card at the top of the page. It never covers or blocks anything: the visitor can ignore it,
 * start the tour, or dismiss it for good (remembered per user in this browser).
 */
export function TourPrompt({ userId, onStart }: { userId: string; onStart: () => void }) {
    const [flag, setFlag] = useLocalFlag(tourKey(userId));
    if (flag !== null) return null; // already seen, or storage not read yet
    return (
        <section aria-label="Welcome tour" className="bg-primary/10 border-primary/30 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3">
            <LuCompass aria-hidden className="text-primary shrink-0" size={20} />
            <p className="min-w-0 flex-1 basis-56 text-sm">
                <span className="font-semibold">New here?</span> Take a 1-minute tour.
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="btn btn-primary btn-sm min-h-11 sm:min-h-8"
                    onClick={() => {
                        setFlag("dismissed");
                        onStart();
                    }}
                >
                    Start
                </button>
                <button type="button" className="btn btn-ghost btn-sm min-h-11 sm:min-h-8" onClick={() => setFlag("dismissed")}>
                    Dismiss
                </button>
                <button type="button" className="btn btn-ghost btn-sm btn-circle size-11 sm:size-8" aria-label="Close tour prompt" onClick={() => setFlag("dismissed")}>
                    <LuX aria-hidden />
                </button>
            </div>
        </section>
    );
}

export default function OnboardingTour({ userId, role, open, onClose }: { userId: string; role: AppRole; open: boolean; onClose: () => void }) {
    const [, setFlag] = useLocalFlag(tourKey(userId));
    const [step, setStep] = useState(0);
    const steps = stepsFor(role);

    const finish = () => {
        setFlag("done");
        setStep(0);
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

export function resetTour(userId: string) {
    writeFlag(tourKey(userId), null);
}
