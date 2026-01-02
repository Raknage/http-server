import * as argon2 from "argon2";

export async function hashPassword(password: string) {
  const hash = await argon2.hash(password);
  return hash;
}

export async function checkPasswordHash(hash: string, password: string) {
  if (await argon2.verify(hash, password)) {
    return true;
  } else {
    return false;
  }
}
