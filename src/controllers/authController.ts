import type { Request, Response } from 'express';
import User, { type UserDocument } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';

const cookieName = 'bhansar_refresh';

function publicUser(user: { _id: unknown; name: string; email: string; role: string; isActive?: boolean }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}

function setRefreshCookie(res: Response, token: string) {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = (await User.findOne({ email: String(email).toLowerCase(), isActive: true }).select('+password')) as UserDocument | null;

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const payload = { id: String(user._id), role: user.role };
  const token = generateAccessToken(payload);
  setRefreshCookie(res, generateRefreshToken(payload));
  return res.json({ token, user: publicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(cookieName);
  return res.json({ success: true });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.[cookieName];
  if (!refreshToken) return res.status(401).json({ message: 'Missing refresh token' });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User is inactive' });
    return res.json({ token: generateAccessToken({ id: String(user._id), role: user.role }), user: publicUser(user) });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user?.id);
  if (!user || !user.isActive) return res.status(404).json({ message: 'User not found' });
  return res.json(publicUser(user));
}
