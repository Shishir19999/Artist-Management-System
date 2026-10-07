"use client";
import { useMemo, useState } from "react";
import { LuActivity } from "react-icons/lu";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { SelectField } from "@/components/ui/Fields";
import { useAuth } from "@/lib/client/auth";
import { useActivity } from "@/lib/client/hooks";
import { ACTIVITY_ENTITIES } from "@/lib/domain/constants";
import ActivityList from "./ActivityList";

export default function ActivityPage() {
    const { user } = useAuth();
    const isManager = user?.role === "ARTIST_MANAGER";
    const { activity, loading, error, reload } = useActivity({ limit: 200 });
    const [entity, setEntity] = useState("");
    const shown = useMemo(() => (entity ? activity.filter((a) => a.entity === entity) : activity), [activity, entity]);

    return (
        <>
            <PageHeader title="Activity" subtitle={isManager ? "Audit trail of everything done in the workspace." : "Your recent actions."} />
            <div className="mb-4 max-w-xs">
                <SelectField label="Filter by type" value={entity} onChange={(e) => setEntity(e.target.value)}>
                    <option value="">Everything</option>
                    {ACTIVITY_ENTITIES.map((e) => (
                        <option key={e} value={e}>
                            {e.charAt(0) + e.slice(1).toLowerCase()}
                        </option>
                    ))}
                </SelectField>
            </div>
            <div className="surface p-4 sm:p-5">
                {loading ? (
                    <SkeletonRows rows={6} />
                ) : error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : shown.length === 0 ? (
                    <EmptyState icon={<LuActivity size={26} />} title="Nothing here yet" message="Actions such as creating or editing records show up in this trail." />
                ) : (
                    <ActivityList items={shown} showUser={isManager} />
                )}
            </div>
        </>
    );
}
