import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
}

export type SessionPayload = {
    userId: string;
    email: string;
    role: "customer" | "organizer" | "admin";
};

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: SessionPayload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifySessionToken(token: string) {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
}
