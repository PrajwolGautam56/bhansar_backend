import dayjs from 'dayjs';
import type { Request, Response } from 'express';
import Reminder from '../models/Reminder.js';

function urgency(date: Date) {
  const due = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');
  if (due.isBefore(today)) return 'OVERDUE';
  if (due.isSame(today)) return 'TODAY';
  return 'UPCOMING';
}

function dateRangeFilter(range: unknown) {
  const today = dayjs().startOf('day');
  if (range === 'today') return { $gte: today.toDate(), $lt: today.add(1, 'day').toDate() };
  if (range === 'overdue') return { $lt: today.toDate() };
  if (range === 'upcoming') return { $gte: today.add(1, 'day').toDate() };
  return undefined;
}

export async function listReminders(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.user?.role === 'AGENT') filter.assignedTo = req.user.id;
  if (req.query.assignedTo && req.user?.role === 'ADMIN') filter.assignedTo = req.query.assignedTo;
  if (req.query.isDone !== undefined) filter.isDone = req.query.isDone === 'true';
  const range = dateRangeFilter(req.query.dateRange);
  if (range) filter.reminderDate = range;

  const reminders = await Reminder.find(filter)
    .populate({ path: 'lead', select: 'fullName company phone stage', populate: { path: 'company', select: 'name' } })
    .populate('assignedTo', 'name')
    .sort({ reminderDate: 1 });

  return res.json(reminders.map((reminder) => ({ ...reminder.toObject(), urgency: urgency(reminder.reminderDate) })));
}

export async function createReminder(req: Request, res: Response) {
  const reminder = await Reminder.create({ ...req.body, assignedTo: req.body.assignedTo || req.user?.id });
  return res.status(201).json(reminder);
}

export async function updateReminder(req: Request, res: Response) {
  const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  return res.json(reminder);
}

export async function deleteReminder(req: Request, res: Response) {
  const reminder = await Reminder.findByIdAndDelete(req.params.id);
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  return res.json({ success: true });
}
