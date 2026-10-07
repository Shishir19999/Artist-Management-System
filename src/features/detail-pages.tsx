"use client";
import DetailGate from "@/components/ui/DetailGate";
import ArtistEdit from "@/features/artists/ArtistEdit";
import ArtistProfile from "@/features/artists/ArtistProfile";
import SongDetail, { SongEdit } from "@/features/music/SongDetail";
import UserDetail, { UserEdit } from "@/features/users/UserDetail";

// Client wrappers so server-rendered route files can stay tiny (render props cannot cross that boundary).
export const ArtistShowPage = () => <DetailGate param="artist_id">{(id) => <ArtistProfile id={id} />}</DetailGate>;
export const ArtistEditPage = () => <DetailGate param="artist_id">{(id) => <ArtistEdit id={id} />}</DetailGate>;
export const SongShowPage = () => <DetailGate param="music_id">{(id) => <SongDetail id={id} />}</DetailGate>;
export const SongEditPage = () => <DetailGate param="music_id">{(id) => <SongEdit id={id} />}</DetailGate>;
export const UserShowPage = () => <DetailGate param="user_id">{(id) => <UserDetail id={id} />}</DetailGate>;
export const UserEditPage = () => <DetailGate param="user_id">{(id) => <UserEdit id={id} />}</DetailGate>;
