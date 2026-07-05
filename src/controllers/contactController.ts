import type { Request, Response } from 'express';
import Contact from '../models/Contact.js';
import { regex } from '../utils/query.js';

function populateContact() {
  return [{ path: 'company', select: 'name' }, { path: 'linkedLeads', select: 'fullName' }];
}

export async function listContacts(req: Request, res: Response) {
  const search = regex(req.query.search);
  const filter: Record<string, unknown> = {};
  if (req.query.company) filter.company = req.query.company;
  if (req.query.relationType) filter.relationType = req.query.relationType;
  if (search) filter.$or = [{ fullName: search }, { phone: search }, { email: search }];
  const contacts = await Contact.find(filter).populate(populateContact()).sort({ updatedAt: -1 });
  return res.json(contacts);
}

export async function createContact(req: Request, res: Response) {
  const contact = await Contact.create(req.body);
  return res.status(201).json(contact);
}

export async function getContact(req: Request, res: Response) {
  const contact = await Contact.findById(req.params.id).populate(populateContact());
  if (!contact) return res.status(404).json({ message: 'Contact not found' });
  return res.json(contact);
}

export async function updateContact(req: Request, res: Response) {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contact) return res.status(404).json({ message: 'Contact not found' });
  return res.json(contact);
}

export async function deleteContact(req: Request, res: Response) {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) return res.status(404).json({ message: 'Contact not found' });
  return res.json({ success: true });
}
