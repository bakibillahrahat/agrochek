import { NextAuthOptions, Session } from "next-auth";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { emailSchema, passwordSchema } from "@/schema/credentials-schema";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import prisma from "@/lib/db";

// Extend the Session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      async authorize(credentials) {
        console.log("Authorize called with:", { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          throw new Error("Email and password are required");
        }

        const emailValidation = emailSchema.safeParse(credentials.email);
        if (!emailValidation.success) {
          console.log("Invalid email format:", emailValidation.error)
          throw new Error("Invalid email format");
        }

        const passwordValidation = passwordSchema.safeParse(credentials.password);
        if (!passwordValidation.success) {
          console.log("Invalid password format:", passwordValidation.error)
          throw new Error(passwordValidation.error.issues[0].message);
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: emailValidation.data
            }
          });

          console.log("Found user:", user ? "yes" : "no")

          if (!user) {
            console.log("Creating new user")
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);
            const newUser = await prisma.user.create({
              data: {
                email: emailValidation.data,
                password: hashedPassword,
              }
            });
            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name ?? "",
            };
          }

          console.log("Verifying password")
          const passwordMatch = await bcrypt.compare(passwordValidation.data, user.password);
          if (!passwordMatch) {
            console.log("Password mismatch")
            throw new Error("Invalid password");
          }

          console.log("Authentication successful")
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
          };
        } catch (error) {
          console.error("Auth error:", error)
          if (error instanceof PrismaClientInitializationError) {
            throw new Error("Internal server error");
          }
          throw error;
        }
      },
    })
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};