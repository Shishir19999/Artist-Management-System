"use client";
import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/Confirm";
import Toaster from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/client/auth";

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ConfirmProvider>
                {children}
                <Toaster />
            </ConfirmProvider>
        </AuthProvider>
    );
}
