import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '../models/User.js';

const accessSecret = () => process.env.JWT_SECRET || 'dev-access-secret';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateAccessToken(payload: { id: string; role: UserRole }) {
  return jwt.sign(payload, accessSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m'
  } as SignOptions);
}

export function generateRefreshToken(payload: { id: string; role: UserRole }) {
  return jwt.sign(payload, refreshSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d'
  } as SignOptions);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret()) as { id: string; role: UserRole };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret()) as { id: string; role: UserRole };
}
