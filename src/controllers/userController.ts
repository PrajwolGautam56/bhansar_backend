import type { Request, Response } from 'express';
import User from '../models/User.js';

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const user = await User.create(req.body);
  const created = await User.findById(user._id).select('-password');
  return res.status(201).json(created);
}

export async function updateUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, role: req.body.role, isActive: req.body.isActive },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
}
