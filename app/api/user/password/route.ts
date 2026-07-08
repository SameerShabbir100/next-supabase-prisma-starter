import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { changePassword } from "@/lib/auth-service";
import { isValidPassword, isNonEmptyString } from "@/lib/validation";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as Record<string, unknown>;

  if (!isNonEmptyString(currentPassword)) {
    return NextResponse.json(
      { error: "Current password is required" },
      { status: 400 },
    );
  }

  if (!isValidPassword(newPassword)) {
    return NextResponse.json(
      { error: "New password must be between 8 and 72 characters" },
      { status: 400 },
    );
  }

  try {
    await changePassword(session.user.id, currentPassword, newPassword);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      // "Current password is incorrect" / "Password change is not available..."
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
