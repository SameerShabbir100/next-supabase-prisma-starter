import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getUserById, updateUserProfile, deleteUser } from "@/lib/auth-service";
import { isValidName, isValidUrl } from "@/lib/validation";

// ---------- Read ----------

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// ---------- Update ----------

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, image } = body as Record<string, unknown>;

  if (name !== undefined && !isValidName(name)) {
    return NextResponse.json(
      { error: "Name must be between 1 and 100 characters" },
      { status: 400 },
    );
  }

  if (image !== undefined && !isValidUrl(image)) {
    return NextResponse.json(
      { error: "Image must be a valid URL" },
      { status: 400 },
    );
  }

  const user = await updateUserProfile(session.user.id, {
    name: name as string | undefined,
    image: image as string | undefined,
  });
  return NextResponse.json({ user });
}

// ---------- Delete ----------

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteUser(session.user.id);

  // Note: this deletes the DB row, but the caller's JWT stays cryptographically
  // valid until the session callback's DB check catches it on next lookup —
  // see the README note on session invalidation.
  return NextResponse.json({ success: true });
}
