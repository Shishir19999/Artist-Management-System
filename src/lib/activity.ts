import prisma from "../../prisma/PrismaClient";
import type { ActivityAction, ActivityEntity } from "./domain/constants";

export interface ActivityActor {
    id: string;
    name?: string | null;
    email?: string | null;
}

/** Append an entry to the audit trail. Never throws: logging must not break the request. */
export async function logActivity(
    user: ActivityActor,
    action: ActivityAction,
    entity: ActivityEntity,
    entityId: string | null | undefined,
    summary: string
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                userName: user.name ?? user.email ?? null,
                action,
                entity,
                entityId: entityId ?? null,
                summary: summary.slice(0, 255),
            },
        });
    } catch (e) {
        console.error("logActivity failed:", e instanceof Error ? e.message : e);
    }
}
