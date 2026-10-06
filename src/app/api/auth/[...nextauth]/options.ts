import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import prisma from "../../../../../prisma/PrismaClient";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { jwtCallback, sessionCallback, signInCallback, signOutEvent } from "@/lib/auth-callbacks";
import { isGoogleEnabled } from "@/lib/google-enabled";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: { signIn: "/auth/login", error: "/auth/login" },
    providers: [
        CredentialsProvider({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "Email" },
                password: { label: "Password", type: "password", placeholder: "Password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                // Google-only accounts have no password
                if (!user || !user.password) return null;

                const passwordMatch = await bcrypt.compare(credentials.password, user.password);
                if (!passwordMatch) return null;

                // return only safe fields (never the hash)
                return { id: user.id, name: user.name, email: user.email, role: user.role };
            }
        }),
        // Only registered when credentials are configured (the login page hides the button otherwise).
        // allowDangerousEmailAccountLinking is deliberately OFF: public sign-up has no e-mail
        // verification, so auto-linking could let someone pre-register a victim's e-mail and then
        // share the account once the victim signs in with Google. A clash shows an explicit error.
        ...(isGoogleEnabled()
            ? [
                  GoogleProvider({
                      clientId: process.env.GOOGLE_CLIENT_ID as string,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
                  }),
              ]
            : []),
    ],
    callbacks: {
        signIn: signInCallback,
        jwt: jwtCallback,
        session: sessionCallback,
    },
    events: {
        signOut: signOutEvent,
    },
}
