import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/password";

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  updatedAt: true,
} satisfies Record<string, boolean>;

export type PublicUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ---------- helpers ----------

const isUniqueConstraintError = (
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError => {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
};

// ---------- Create ----------

export async function createUser(data: {
  name?: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const hashedPassword = await hashPassword(data.password);

  try {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: PUBLIC_USER_FIELDS,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new Error("User already exists");
    }
    throw err;
  }
}

// ---------- Read ----------

export async function getUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_FIELDS,
  });
}

export async function getUserByEmail(
  email: string,
): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { email },
    select: PUBLIC_USER_FIELDS,
  });
}

// ---------- Update ----------

export async function updateUserProfile(
  id: string,
  data: { name?: string; image?: string },
): Promise<PublicUser> {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.image !== undefined && { image: data.image }),
    },
    select: PUBLIC_USER_FIELDS,
  });
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true },
  });

  if (!user || !user.password) {
    // No password set (e.g. OAuth-only account) — nothing to verify against
    throw new Error("Password change is not available for this account");
  }

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

// ---------- Delete ----------

export async function deleteUser(id: string): Promise<void> {
  // Account and Session rows cascade-delete via the schema's onDelete: Cascade
  await prisma.user.delete({ where: { id } });
}
