import { IS_DEMO } from "./mode";

// Dynamic segments cannot be enumerated in a static export, so the demo build uses ?id= detail pages.
const detail = (base: string, id: string) => (IS_DEMO ? `${base}/?id=${encodeURIComponent(id)}` : `${base}/${encodeURIComponent(id)}`);

export const routes = {
    home: "/",
    login: "/auth/login",
    register: "/auth/register",
    dashboard: "/admin/dashboard",
    artists: "/admin/artist",
    artistNew: "/admin/artist/create",
    artistShow: (id: string) => detail("/admin/artist/show", id),
    artistEdit: (id: string) => detail("/admin/artist/edit", id),
    music: "/admin/music",
    musicNew: "/admin/music/create",
    musicShow: (id: string) => detail("/admin/music/show", id),
    musicEdit: (id: string) => detail("/admin/music/edit", id),
    users: "/admin/user",
    userNew: "/admin/user/create",
    userShow: (id: string) => detail("/admin/user/show", id),
    userEdit: (id: string) => detail("/admin/user/edit", id),
    playlists: "/admin/playlists",
    playlist: (id: string) => `/admin/playlists?id=${encodeURIComponent(id)}`,
    favorites: "/admin/favorites",
    calendar: "/admin/calendar",
    activity: "/admin/activity",
    profile: "/admin/profile",
} as const;
