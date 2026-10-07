"use client";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

export default function GoToBack() {
    const router = useRouter();
    return (
        <button type="button" className="btn btn-primary min-h-11 gap-2" onClick={() => router.back()}>
            <LuArrowLeft aria-hidden /> Go back
        </button>
    );
}
