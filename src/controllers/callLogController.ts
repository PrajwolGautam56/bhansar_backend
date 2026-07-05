import dayjs from 'dayjs';
import type { Request, Response } from 'express';
import CallLog from '../models/CallLog.js';
import Lead from '../models/Lead.js';
import Reminder from '../models/Reminder.js';
import { paginate } from '../utils/query.js';

export async function createCallLog(req: Request, res: Response) {
  const { leadId, outcome, remarks, nextAction, nextActionDate, calledAt, callDurationSeconds } = req.body;
  const callDate = calledAt ? dayjs(calledAt).toDate() : new Date();
  const duration = Number(callDurationSeconds);
  const log = await CallLog.create({
    lead: leadId,
    calledBy: req.user?.id,
    calledAt: callDate,
    callDurationSeconds: Number.isFinite(duration) && duration >= 0 ? duration : undefined,
    outcome,
    remarks,
    nextAction
  });
  const lead = await Lead.findByIdAndUpdate(leadId, { lastCalledDate: callDate, nextCallDate: nextActionDate }, { new: true });

  if (lead && nextActionDate) {
    await Reminder.findOneAndUpdate(
      { lead: lead._id, isDone: false },
      { lead: lead._id, assignedTo: lead.assignedTo || req.user?.id, reminderDate: dayjs(nextActionDate).toDate(), note: nextAction || remarks },
      { upsert: true, new: true }
    );
  }

  return res.status(201).json(await log.populate([{ path: 'lead', select: 'fullName company' }, { path: 'calledBy', select: 'name' }]));
}

export async function listCallLogs(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.leadId) filter.lead = req.query.leadId;
  if (req.query.calledBy) filter.calledBy = req.query.calledBy;
  return res.json(
    await paginate(CallLog, filter, req.query, {
      sort: { calledAt: -1 },
      populate: [
        { path: 'lead', select: 'fullName company', populate: { path: 'company', select: 'name' } },
        { path: 'calledBy', select: 'name' }
      ]
    })
  );
}
