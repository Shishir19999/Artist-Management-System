#!/usr/bin/env node
/**
 * Builds the browser-only demo as a static site (GitHub Pages).
 *
 * The real source tree is never modified: the project is copied to .pages-build/, the server-only
 * parts (API routes, proxy, NextAuth, Prisma) are removed there, "*.demo.tsx" files replace their
 * server-backed counterparts, dynamic detail routes become ?id= pages, and `next build` exports
 * a fully static site into dist-pages/.
 *
 *   npm run build:pages
 *   BASE_PATH=/other-repo npm run build:pages    (default: /Artist-Management-System)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, ".pages-build");
const dist = path.join(root, "dist-pages");
const basePath = (process.env.BASE_PATH ?? "/Artist-Management-System").replace(/\/+$/, "");

const log = (m) => console.log(`[build:pages] ${m}`);
const rm = (p) => fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });

function walk(dir, visit) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        visit(full, entry);
        if (entry.isDirectory()) walk(full, visit);
    }
}

// 1. fresh copy of the sources (no dependencies, env files, build output or git data)
rm(work);
fs.mkdirSync(work, { recursive: true });
const copy = ["src", "public", "package.json", "postcss.config.mjs", "tsconfig.json"];
for (const item of copy) {
    if (fs.existsSync(path.join(root, item))) fs.cpSync(path.join(root, item), path.join(work, item), { recursive: true });
}
fs.symlinkSync(path.join(root, "node_modules"), path.join(work, "node_modules"), "junction");

// 2. server-only code out
const src = path.join(work, "src");
const apiDir = path.join(src, "app", "api");
// request schemas are plain zod objects shared with the in-browser API, everything else in /api is server code
walk(apiDir, (full, entry) => {
    if (entry.isFile() && !/Schema\.tsx?$/.test(entry.name)) fs.rmSync(full);
});
for (const f of ["proxy.ts", "lib/authz.ts", "lib/activity.ts", "lib/playlist-songs.ts", "lib/rate-limit.ts", "lib/auth-callbacks.ts", "lib/google-enabled.ts"]) {
    // the demo swap below may still need some of these removed only after the swap
    if (fs.existsSync(path.join(src, f))) fs.rmSync(path.join(src, f));
}

// 3. swap in the demo implementations: foo.demo.tsx -> foo.tsx
let swapped = 0;
walk(src, (full, entry) => {
    const m = entry.isFile() && /^(.*)\.demo\.(tsx?)$/.exec(entry.name);
    if (!m) return;
    fs.renameSync(full, path.join(path.dirname(full), `${m[1]}.${m[2]}`));
    swapped++;
});
log(`swapped ${swapped} demo files`);

// 4. dynamic detail routes cannot be enumerated: /x/show/[id]/page.tsx -> /x/show/page.tsx (reads ?id=)
let flattened = 0;
walk(path.join(src, "app"), (full, entry) => {
    if (!entry.isDirectory() || !/^\[[^\]]+\]$/.test(entry.name)) return;
    const page = path.join(full, "page.tsx");
    if (fs.existsSync(page)) {
        fs.renameSync(page, path.join(path.dirname(full), "page.tsx"));
        flattened++;
    }
});
walk(path.join(src, "app"), () => {});
// remove the now-empty [param] directories (deepest first)
const dyn = [];
walk(path.join(src, "app"), (full, entry) => {
    if (entry.isDirectory() && /^\[[^\]]+\]$/.test(entry.name)) dyn.push(full);
});
for (const d of dyn.sort((a, b) => b.length - a.length)) if (fs.existsSync(d)) rm(d);
log(`flattened ${flattened} detail routes`);

// 5. static-export configuration (only exists in the copy)
fs.writeFileSync(
    path.join(work, "next.config.mjs"),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: ${JSON.stringify(basePath)},
    assetPrefix: ${JSON.stringify(basePath)},
    trailingSlash: true,
    images: { unoptimized: true },
    env: { NEXT_PUBLIC_DEMO: "true", NEXT_PUBLIC_BASE_PATH: ${JSON.stringify(basePath)} },
    typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
`
);
// the copy has no tests, scripts or prisma folder
const tsconfigPath = path.join(work, "tsconfig.json");
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
tsconfig.include = ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"];
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

// 6. build
log(`next build (basePath ${basePath})`);
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = [nextBin, "build", ...(process.env.PAGES_WEBPACK ? ["--webpack"] : [])];
const res = spawnSync(process.execPath, args, {
    cwd: work,
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_DEMO: "true", NEXT_PUBLIC_BASE_PATH: basePath, NEXT_TELEMETRY_DISABLED: "1" },
});
if (res.status !== 0) {
    console.error("[build:pages] next build failed");
    fs.unlinkSync(path.join(work, "node_modules"));
    rm(work);
    process.exit(res.status ?? 1);
}

// 7. publish the export
rm(dist);
fs.cpSync(path.join(work, "out"), dist, { recursive: true });
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

// Next writes per-segment prefetch payloads into nested folders (__next.a/b/__PAGE__.txt) but requests them
// with dotted names (__next.a.b.__PAGE__.txt); a static host needs both spellings to avoid 404s.
let aliased = 0;
walk(dist, (full, entry) => {
    if (!entry.isFile()) return;
    const parts = path.relative(dist, full).split(path.sep);
    const i = parts.findIndex((p) => p.startsWith("__next.") && p !== parts[parts.length - 1]);
    if (i === -1) return;
    const dotted = parts.slice(i).join(".");
    const target = path.join(dist, ...parts.slice(0, i), dotted);
    if (!fs.existsSync(target)) {
        fs.copyFileSync(full, target);
        aliased++;
    }
});
log(`added ${aliased} dotted prefetch aliases`);
fs.unlinkSync(path.join(work, "node_modules")); // remove the junction, never the real folder
rm(work);
log(`done: ${path.relative(root, dist)}/ (serve it under ${basePath}/)`);
