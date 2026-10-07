import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { handleDemoRequest } from "./server";
import { getSessionUserId, loadDb, saveDb } from "./store";

function parseBody(data: unknown): unknown {
    if (typeof data !== "string") return data ?? undefined;
    try {
        return JSON.parse(data);
    } catch {
        return undefined;
    }
}

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const url = new URL(config.url ?? "/", "http://demo.local");
    const method = (config.method ?? "get").toUpperCase();
    // a short delay keeps loading states visible and behaves like a real network call
    await new Promise((r) => setTimeout(r, 120));
    const result = handleDemoRequest(loadDb(), getSessionUserId(), {
        method,
        path: url.pathname,
        query: url.searchParams,
        body: parseBody(config.data),
    });
    if (method !== "GET") saveDb();
    const response = {
        data: JSON.parse(JSON.stringify(result.data)),
        status: result.status,
        statusText: String(result.status),
        headers: {},
        config,
    };
    if (result.status >= 400) {
        try {
            // developer aid: the screens must not ask for things their role cannot use
            if (sessionStorage.getItem("ams-debug")) console.error(`[preview api] ${method} ${url.pathname} -> ${result.status}`);
        } catch {
            /* storage unavailable */
        }
        throw new AxiosError(`Request failed with status code ${result.status}`, AxiosError.ERR_BAD_REQUEST, config, null, response);
    }
    return response;
};

/** Routes every axios call to the in-browser demo server. Idempotent. */
export function installDemoAdapter() {
    axios.defaults.adapter = adapter;
}
