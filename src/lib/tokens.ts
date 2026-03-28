import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export function generateStreamPath(): string {
  return randomBytes(8).toString("hex");
}
