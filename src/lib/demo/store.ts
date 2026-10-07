import { DEMO_VERSION, buildSeed, type DemoDb } from "./seed";

const DB_KEY = "ams-demo-db";
const SESSION_KEY = "ams-demo-session";

let cache: DemoDb | null = null;
let memorySession: string | null = null;

function read(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key: string, value: string | null) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        /* storage unavailable or full: the demo keeps working from memory for this tab */
    }
}

export function loadDb(): DemoDb {
    if (cache) return cache;
    const raw = read(DB_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw) as DemoDb;
            if (parsed.version === DEMO_VERSION && Array.isArray(parsed.artists)) {
                cache = parsed;
                return cache;
            }
        } catch {
            /* corrupt data: reseed below */
        }
    }
    cache = buildSeed();
    saveDb();
    return cache;
}

export function saveDb() {
    if (cache) write(DB_KEY, JSON.stringify(cache));
}

export function resetDb() {
    cache = buildSeed();
    saveDb();
    setSessionUserId(null);
}

export function getSessionUserId(): string | null {
    return read(SESSION_KEY) ?? memorySession;
}

const listeners = new Set<() => void>();
export function subscribeSession(cb: () => void) {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
}

export function setSessionUserId(id: string | null) {
    memorySession = id;
    write(SESSION_KEY, id);
    listeners.forEach((l) => l());
}
