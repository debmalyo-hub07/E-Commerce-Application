import { jwtVerify } from "jose";
import { connectDB } from "../lib/mongoose";
import User from "@/models/User";

export type Role = "ADMIN" | "CUSTOMER";

interface JWTPayload {
  id: string;
  role: Role;
  status: string;
  email?: string;
  name?: string;
}

export async function decodeJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function assertRole(userRole: Role, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(userRole)) {
    const error = new Error(
      `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`
    );
    (error as Error & { error_code: string; statusCode: number }).error_code = "FORBIDDEN";
    (error as Error & { error_code: string; statusCode: number }).statusCode = 403;
    throw error;
  }
}

export async function assertUserActive(userId: string): Promise<void> {
  await connectDB();
  const user = await User.findById(userId).select("status").lean();

  if (!user || user.status !== "ACTIVE") {
    const error = new Error("Your account has been suspended. Please contact support.");
    (error as Error & { error_code: string; statusCode: number }).error_code = "ACCOUNT_SUSPENDED";
    (error as Error & { error_code: string; statusCode: number }).statusCode = 403;
    throw error;
  }
}
