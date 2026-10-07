"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/lib/client/theme";

export default function Toaster() {
    const theme = useTheme();
    return (
        <ToastContainer
            position="bottom-right"
            theme={theme === "studio-dark" ? "dark" : "light"}
            limit={3}
            autoClose={4000}
            closeButton
            pauseOnFocusLoss={false}
            toastClassName="!rounded-xl"
            aria-label="Notifications"
        />
    );
}
