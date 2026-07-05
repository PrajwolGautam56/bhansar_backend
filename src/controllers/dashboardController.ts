import dayjs from 'dayjs';
import type { Request, Response } from 'express';
import CallLog from '../models/CallLog.js';
import Company from '../models/Company.js';
import Lead from '../models/Lead.js';
import Reminder from '../models/Reminder.js';

export async function stats(req: Request, res: Response) {
  const leadScope = req.user?.role === 'AGENT' ? { assignedTo: req.user.id } : {};
  const today = dayjs().startOf('day');
  const tomorrow = today.add(1, 'day');

  const [totalLeads, totalCompanies, clientLeads, callsDueToday, overdueReminders, upcomingFollowUps, recentCallLogs, overdueLeads] =
    await Promise.all([
      Lead.countDocuments(leadScope),
      Company.countDocuments(),
      Lead.countDocuments({ ...leadScope, stage: 'CLIENT' }),
      Reminder.countDocuments({ ...(req.user?.role === 'AGENT' ? { assignedTo: req.user.id } : {}), isDone: false, reminderDate: { $gte: today.toDate(), $lt: tomorrow.toDate() } }),
      Reminder.countDocuments({ ...(req.user?.role === 'AGENT' ? { assignedTo: req.user.id } : {}), isDone: false, reminderDate: { $lt: today.toDate() } }),
      Lead.find({ ...leadScope, nextCallDate: { $exists: true } })
        .populate('company', 'name location')
        .populate('assignedTo', 'name')
        .sort({ nextCallDate: 1 })
        .limit(8),
      CallLog.find()
        .populate({ path: 'lead', select: 'fullName company', populate: { path: 'company', select: 'name' } })
        .populate('calledBy', 'name')
        .sort({ calledAt: -1 })
        .limit(5),
      Lead.find({ ...leadScope, nextCallDate: { $lt: today.toDate() }, stage: { $ne: 'CLIENT' } })
        .populate('company', 'name')
        .populate('assignedTo', 'name')
        .limit(8)
    ]);

  return res.json({
    totalLeads,
    totalCompanies,
    callsDueToday,
    overdueReminders,
    conversionRate: totalLeads ? Math.round((clientLeads / totalLeads) * 100) : 0,
    upcomingFollowUps,
    recentCallLogs,
    overdueLeads
  });
}
