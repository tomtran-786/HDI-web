import bcrypt from "bcryptjs";

const DUMMY_PASSWORD_HASH =
  "$2b$12$Yf3BzKgi5ZWfPXQN9LDUuOriHeXjeSrlpm5cKl..5K.wmGE8aQr4e";

export type CredentialUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  passwordHash: string | null;
};

/** Compare even for a missing user/hash so an email lookup is not a timing oracle. */
export async function verifiedCredentialIdentity(
  user: CredentialUser | null,
  password: string,
) {
  const matches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !user.emailVerified || !user.passwordHash || !matches) return null;
  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
