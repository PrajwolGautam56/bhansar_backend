import type { Request, Response } from 'express';
import CallLog from '../models/CallLog.js';
import Lead from '../models/Lead.js';
import Reminder from '../models/Reminder.js';
import { paginate, regex } from '../utils/query.js';

async function syncReminder(lead: any) {
  if (!lead?.nextCallDate || !lead.assignedTo) return;
  await Reminder.findOneAndUpdate(
    { lead: lead._id, isDone: false },
    { lead: lead._id, assignedTo: lead.assignedTo, reminderDate: lead.nextCallDate, note: lead.remarks || 'Follow up' },
    { upsert: true, new: true }
  );
}

function scopedLeadFilter(req: Request) {
  return req.user?.role === 'AGENT' ? { assignedTo: req.user.id } : {};
}

export async function listLeads(req: Request, res: Response) {
  const search = regex(req.query.search);
  const filter: Record<string, unknown> = { ...scopedLeadFilter(req) };
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (search) filter.$or = [{ fullName: search }, { phone: search }, { email: search }, { mutualPerson: search }];

  return res.json(
    await paginate(Lead, filter, req.query, {
      sort: { nextCallDate: 1, createdAt: -1 },
      populate: [
        { path: 'company', select: 'name location importProducts importFrequency entryPort' },
        { path: 'assignedTo', select: 'name' },
        { path: 'relatedLeads', select: 'fullName company', populate: { path: 'company', select: 'name' } },
        { path: 'relatedContacts', select: 'fullName' }
      ]
    })
  );
}

export async function createLead(req: Request, res: Response) {
  const assignedTo = req.body.assignedTo || req.user?.id;
  const lead = await Lead.create({ ...req.body, assignedTo, createdBy: req.user?.id });
  await syncReminder(await Lead.findById(lead._id));
  return res.status(201).json(lead);
}

export async function getLead(req: Request, res: Response) {
  const lead = await Lead.findOne({ _id: req.params.id, ...scopedLeadFilter(req) })
    .populate('company')
    .populate('assignedTo', 'name')
    .populate('relatedLeads', 'fullName company')
    .populate('relatedContacts', 'fullName phone relationType');
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  const [callLogs, reminders] = await Promise.all([
    CallLog.find({ lead: lead._id }).populate('calledBy', 'name').sort({ calledAt: -1 }),
    Reminder.find({ lead: lead._id }).populate('assignedTo', 'name').sort({ reminderDate: 1 })
  ]);

  return res.json({ lead, callLogs, reminders });
}

export async function updateLead(req: Request, res: Response) {
  const lead = await Lead.findOneAndUpdate({ _id: req.params.id, ...scopedLeadFilter(req) }, req.body, {
    new: true,
    runValidators: true
  });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  await syncReminder(lead);
  return res.json(lead);
}

export async function deleteLead(req: Request, res: Response) {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  await Promise.all([Reminder.deleteMany({ lead: req.params.id }), CallLog.deleteMany({ lead: req.params.id })]);
  return res.json({ success: true });
}
