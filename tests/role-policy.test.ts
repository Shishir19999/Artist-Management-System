import { describe, expect, it } from "vitest";
import { DASHBOARD_CARDS, NAV_ENTRIES, SELF_REGISTER_ROLES, canEditArtist, canEditSong, canOpenPage, navFor } from "@/lib/client/role-policy";
import { decideAccess } from "@/lib/domain/access";
import { ROLES } from "@/lib/roles";
import { stepsFor } from "@/components/shell/OnboardingTour";

const labels = (role: (typeof ROLES)[number], group: "main" | "more") => navFor(role, group).map((n) => n.label);

describe("sidebar per role", () => {
    it("Artist Manager: Dashboard, Artists, Music, Users + More: Activity, Calendar, Playlists, Favorites", () => {
        expect(labels("ARTIST_MANAGER", "main")).toEqual(["Dashboard", "Artists", "Music", "Users"]);
        expect(labels("ARTIST_MANAGER", "more")).toEqual(["Activity", "Calendar", "Playlists", "Favorites"]);
    });
    it("Artist: Dashboard, My Profile, Music + More: Calendar, Playlists, Favorites", () => {
        expect(labels("ARTIST", "main")).toEqual(["Dashboard", "My Profile", "Music"]);
        expect(labels("ARTIST", "more")).toEqual(["Calendar", "Playlists", "Favorites"]);
    });
    it("User: Dashboard, Music + More: Playlists, Favorites", () => {
        expect(labels("USER", "main")).toEqual(["Dashboard", "Music"]);
        expect(labels("USER", "more")).toEqual(["Playlists", "Favorites"]);
    });
    it("never lists a page the role cannot open (no dead links)", () => {
        for (const role of ROLES) {
            for (const g of ["main", "more"] as const) {
                for (const n of navFor(role, g)) {
                    const href = n.id === "myProfile" ? "/admin/artist/show/a_1" : n.href;
                    expect(canOpenPage(role, href), `${role} ${href}`).toBe(true);
                }
            }
        }
    });
    it("page access is exactly what src/lib/domain/access.ts decides", () => {
        const pages = ["/admin/dashboard", "/admin/artist", "/admin/artist/create", "/admin/artist/show/a_1", "/admin/artist/edit/a_1", "/admin/music", "/admin/music/create", "/admin/music/show/s_1", "/admin/music/edit/s_1", "/admin/user", "/admin/user/create", "/admin/activity", "/admin/calendar", "/admin/playlists", "/admin/favorites", "/admin/profile"];
        for (const role of ROLES) for (const p of pages) expect(canOpenPage(role, p), `${role} ${p}`).toBe(decideAccess({ pathname: p, method: "GET", role }) === "allow");
    });
    it("hides nothing a role can use from its menu: every allowed top-level page is listed", () => {
        for (const role of ROLES) {
            for (const n of NAV_ENTRIES.filter((e) => e.id !== "myProfile")) {
                expect(n.roles.includes(role), `${role} ${n.href}`).toBe(canOpenPage(role, n.href));
            }
        }
    });
});

describe("dashboard cards follow the original layout", () => {
    it("3 cards for the manager, 2 for an artist, 1 for a user", () => {
        expect(DASHBOARD_CARDS.ARTIST_MANAGER).toEqual(["users", "artists", "music"]);
        expect(DASHBOARD_CARDS.ARTIST).toEqual(["profile", "music"]);
        expect(DASHBOARD_CARDS.USER).toEqual(["music"]);
    });
});

describe("page access by direct URL", () => {
    it("the manager opens everything", () => {
        for (const p of ["/admin/user", "/admin/user/create", "/admin/artist/create", "/admin/artist/edit/a_1", "/admin/music/create", "/admin/activity", "/admin/calendar", "/admin/playlists", "/admin/favorites"]) {
            expect(canOpenPage("ARTIST_MANAGER", p), p).toBe(true);
        }
    });
    it("an artist has no user, artist-list or activity pages", () => {
        for (const p of ["/admin/user", "/admin/user/show", "/admin/artist", "/admin/artist/create", "/admin/activity"]) {
            expect(canOpenPage("ARTIST", p), p).toBe(false);
        }
        for (const p of ["/admin/artist/show/a_2", "/admin/artist/edit/a_1", "/admin/music", "/admin/music/create", "/admin/music/edit/s_1", "/admin/calendar", "/admin/playlists", "/admin/favorites", "/admin/profile"]) {
            expect(canOpenPage("ARTIST", p), p).toBe(true);
        }
    });
    it("a user only reads music and keeps favorites and playlists", () => {
        for (const p of ["/admin/dashboard", "/admin/music", "/admin/music/show/s_1", "/admin/favorites", "/admin/playlists", "/admin/profile"]) {
            expect(canOpenPage("USER", p), p).toBe(true);
        }
        for (const p of ["/admin/artist", "/admin/artist/show/a_1", "/admin/user", "/admin/music/create", "/admin/music/edit/s_1", "/admin/calendar", "/admin/activity"]) {
            expect(canOpenPage("USER", p), p).toBe(false);
        }
    });
    it("ignores trailing slashes and query strings (static export URLs)", () => {
        expect(canOpenPage("USER", "/admin/user/")).toBe(false);
        expect(canOpenPage("USER", "/admin/music/edit/?id=s_1")).toBe(false);
        expect(canOpenPage("ARTIST", "/admin/artist/show/?id=a_1")).toBe(true);
    });
});

describe("row-level rules", () => {
    const manager = { id: "m", role: "ARTIST_MANAGER" as const };
    const artist = { id: "u1", role: "ARTIST" as const };
    const listener = { id: "u2", role: "USER" as const };
    it("artists change only their own profile", () => {
        expect(canEditArtist(manager, { createdBy: "x" })).toBe(true);
        expect(canEditArtist(artist, { createdBy: "u1" })).toBe(true);
        expect(canEditArtist(artist, { createdBy: "u3" })).toBe(false);
        expect(canEditArtist(listener, { createdBy: "u2" })).toBe(false);
    });
    it("artists change only music of their own artist", () => {
        expect(canEditSong(manager, { artistId: "a9" }, null)).toBe(true);
        expect(canEditSong(artist, { artistId: "a1" }, "a1")).toBe(true);
        expect(canEditSong(artist, { artistId: "a2" }, "a1")).toBe(false);
        expect(canEditSong(artist, { artistId: "a1" }, null)).toBe(false);
        expect(canEditSong(listener, { artistId: "a1" }, "a1")).toBe(false);
    });
});

describe("registration and tour", () => {
    it("offers only User and Artist to the public", () => {
        expect([...SELF_REGISTER_ROLES]).toEqual(["USER", "ARTIST"]);
    });
    it("the tour has role specific steps", () => {
        expect(stepsFor("ARTIST_MANAGER").some((s) => s.title.includes("Users"))).toBe(true);
        expect(stepsFor("ARTIST").some((s) => s.title === "My Profile")).toBe(true);
        expect(stepsFor("USER").some((s) => s.body.includes("Favorites"))).toBe(true);
    });
});
