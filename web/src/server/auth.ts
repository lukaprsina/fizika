import { type SolidAuthConfig } from "@solid-auth/base";
import Google from "@auth/core/providers/google";
import Github from "@auth/core/providers/github";
import Microsoft from "@auth/core/providers/azure-ad-b2c";
import Discord from "@auth/core/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { serverEnv } from "~/env/server";

declare module "@auth/core/types" {
  export interface Session {
    user?: {
      id?: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: SolidAuthConfig = {
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // @ts-expect-error - this is a valid adapter
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: serverEnv.CLIENT_ID_DISCORD,
      clientSecret: serverEnv.CLIENT_SECRET_DISCORD,
    }),
    Google({
      clientId: serverEnv.CLIENT_ID_GOOGLE,
      clientSecret: serverEnv.CLIENT_SECRET_GOOGLE,
    }),
    Microsoft({
      clientId: serverEnv.CLIENT_ID_MICROSOFT,
      clientSecret: serverEnv.CLIENT_SECRET_MICROSOFT,
    }),
    Github({
      clientId: serverEnv.CLIENT_ID_GITHUB,
      clientSecret: serverEnv.CLIENT_SECRET_GITHUB,
    }),
  ],
  debug: false,
};
