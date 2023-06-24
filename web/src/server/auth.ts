import { type SolidAuthConfig } from "@solid-auth/base";
import Google from "@auth/core/providers/google";
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
  // TODO: @ ts-expect-error - this is a valid adapter
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: serverEnv.CLIENT_ID_GOOGLE,
      clientSecret: serverEnv.CLIENT_SECRET_GOOGLE,
    }),
  ],
  debug: false,
};
