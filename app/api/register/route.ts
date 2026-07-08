import { NextResponse } from "next/server";

import { createUser } from "@/lib/auth-service";
import { isValidEmail, isValidPassword, isValidName } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters" },
      { status: 400 },
    );
  }

  if (name !== undefined && !isValidName(name)) {
    return NextResponse.json(
      { error: "Name must be between 1 and 100 characters" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({
      name: name as string | undefined,
      email,
      password,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "User already exists") {
      // Deliberately vague — don't reveal which emails already have accounts
      return NextResponse.json(
        { error: "Unable to create account with these details" },
        { status: 409 },
      );
    }
    throw err;
  }
}
