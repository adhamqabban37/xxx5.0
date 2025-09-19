import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "../../../../lib/bcryptjs";
import "../../../../types/auth";

export const runtime = "nodejs";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is required");
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object (exclude password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.email, // Use email as name since User model doesn't have name field
          };
        } catch (error) {
          // Log error but don't expose details to client
          console.error("Auth error:", error instanceof Error ? error.message : "Unknown error");
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };