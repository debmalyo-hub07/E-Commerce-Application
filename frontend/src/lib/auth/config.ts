import NextAuth, { NextAuthConfig, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { z } from "zod";
import { connectDB } from "../mongoose";
import UserModel from "../../models/User";
import AuditLog from "../../models/AuditLog";

declare module "next-auth" {
  interface User {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
  interface Session {
    user: User & {
      id: string;
      role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
      status: "ACTIVE" | "SUSPENDED" | "DELETED";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig = {
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid email or password format");
        }

        const { email, password } = parsed.data;

        await connectDB();
        const user = await UserModel.findOne({ email });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Account is suspended. Please contact support.");
        }

        if (!user.passwordHash) {
          throw new Error("Account uses social login. Please sign in with Google.");
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
        session.user.status = token.status as "ACTIVE" | "SUSPENDED" | "DELETED";
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        await UserModel.findOneAndUpdate(
          { email: user.email! },
          {
            $setOnInsert: {
              name: user.name,
              email: user.email,
              role: "CUSTOMER",
              status: "ACTIVE",
              emailVerified: true,
            },
          },
          { upsert: true }
        );
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (!user?.id) return;
      await connectDB();
      await AuditLog.create({
        userId: user.id,
        action: isNewUser ? "REGISTER" : "LOGIN",
        entityType: "User",
        entityId: user.id,
      });
    },
    async signOut(message) {
      await connectDB();
      if ("token" in message && message.token) {
        const t = message.token as JWT;
        if (t.id) {
          await AuditLog.create({
            userId: t.id,
            action: "LOGOUT",
            entityType: "User",
            entityId: t.id,
          });
        }
      } else if ("session" in message && message.session) {
        const s = message.session as { user?: { id?: string } };
        if (s.user?.id) {
          await AuditLog.create({
            userId: s.user.id,
            action: "LOGOUT",
            entityType: "User",
            entityId: s.user.id,
          });
        }
      }
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
