import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "../../../../lib/bcryptjs";
import { z } from "zod";
import { logger } from "../../../../lib/logger";
import { validateRequest, createErrorResponse, createSuccessResponse } from "@/lib/validation";

export const runtime = "nodejs";

const prisma = new PrismaClient();

// Validation schema
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, signupSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    logger.logAuth('signup_attempt', email, {
      request: logger.extractRequestContext(request)
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logger.logAuth('signup_failed', email, { 
        reason: 'user_exists' 
      });
      return createErrorResponse("User already exists with this email", 409);
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    logger.logAuth('signup_success', email, { 
      userId: user.id 
    });

    // Return success (don't include password hash)
    return createSuccessResponse({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
      }
    }, 201);

  } catch (error) {
    logger.logAuth('signup_error', 'unknown', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return createErrorResponse("Internal server error", 500);
  }
}