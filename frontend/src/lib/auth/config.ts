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
    role: "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
  interface Session {
    user: User & {
      id: string;
      role: "ADMIN" | "CUSTOMER";
      status: "ACTIVE" | "SUSPENDED" | "DELETED";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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

        // Check if email is verified
        if (!user.emailVerified) {
           throw new Error("Please verify your email before logging in. If you lost the code, register again to resend.");
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
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await UserModel.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.picture = dbUser.avatarUrl || user.image; // prefer db image, fallback to Google's
          } else {
            token.id = user.id;
            token.role = "CUSTOMER";
            token.status = "ACTIVE";
            token.picture = user.image;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
          token.status = user.status;
          // For credentials, user.image won't be set initially, we need to fetch it or rely on DB
          await connectDB();
          const dbUser = await UserModel.findById(user.id);
          if (dbUser) {
            token.picture = dbUser.avatarUrl;
          }
        }
      }

      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.email !== undefined) token.email = session.email;
        if (session.image !== undefined) token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "CUSTOMER";
        session.user.status = token.status as "ACTIVE" | "SUSPENDED" | "DELETED";
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
    async signIn({ user, account }) {
      await connectDB();
      const dbUser = await UserModel.findOne({ email: user.email! });
      
      if (dbUser && dbUser.status !== "ACTIVE") {
        return "/login?error=AccessDenied"; // Redirects back with access denied instead of crashing
      }

      if (account?.provider === "google") {
        if (!dbUser) {
          await UserModel.create({
            name: user.name,
            email: user.email,
            role: "CUSTOMER",
            status: "ACTIVE",
            emailVerified: true,
            avatarUrl: user.image, // save google image to DB
          });
        } else {
          // If the user registered with email but didn't verify, and now logs in with Google, mark as verified
          let updated = false;
          if (!dbUser.emailVerified) {
            dbUser.emailVerified = true;
            updated = true;
          }
          if (!dbUser.avatarUrl && user.image) {
            dbUser.avatarUrl = user.image;
            updated = true;
          }
          if (updated) {
            await dbUser.save();
          }
        }
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
