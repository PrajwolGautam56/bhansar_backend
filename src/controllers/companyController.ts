import type { Request, Response } from 'express';
import CallLog from '../models/CallLog.js';
import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import Lead from '../models/Lead.js';
import { paginate, regex } from '../utils/query.js';

export async function listCompanies(req: Request, res: Response) {
  const search = regex(req.query.search);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (search) filter.name = search;
  return res.json(
    await paginate(Company, filter, req.query, {
      sort: { updatedAt: -1 },
      populate: { path: 'createdBy', select: 'name' }
    })
  );
}

export async function createCompany(req: Request, res: Response) {
  const { leads = [], contacts = [], ...companyPayload } = req.body;
  const company = await Company.create({ ...companyPayload, createdBy: req.user?.id });

  const createdLeads = await Lead.insertMany(
    (Array.isArray(leads) ? leads : [])
      .filter((lead) => lead?.fullName)
      .map((lead) => ({
        ...lead,
        company: company._id,
        assignedTo: lead.assignedTo || req.user?.id,
        createdBy: req.user?.id
      }))
  );

  const createdContacts = await Contact.insertMany(
    (Array.isArray(contacts) ? contacts : [])
      .filter((contact) => contact?.fullName)
      .map((contact) => ({
        ...contact,
        company: company._id,
        linkedLeads: contact.linkToCreatedLeads ? createdLeads.map((lead) => lead._id) : contact.linkedLeads || []
      }))
  );

  return res.status(201).json({ company, leads: createdLeads, contacts: createdContacts });
}

export async function getCompany(req: Request, res: Response) {
  const company = await Company.findById(req.params.id).populate('createdBy', 'name');
  if (!company) return res.status(404).json({ message: 'Company not found' });

  const [leads, contacts, callLogs] = await Promise.all([
    Lead.find({ company: company._id }).populate('assignedTo', 'name').sort({ nextCallDate: 1 }),
    Contact.find({ company: company._id }).populate('linkedLeads', 'fullName'),
    CallLog.find({ lead: { $in: await Lead.find({ company: company._id }).distinct('_id') } })
      .populate('lead', 'fullName company')
      .populate('calledBy', 'name')
      .sort({ calledAt: -1 })
  ]);

  return res.json({ company, leads, contacts, callLogs });
}

export async function updateCompany(req: Request, res: Response) {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) return res.status(404).json({ message: 'Company not found' });
  return res.json(company);
}

export async function deleteCompany(req: Request, res: Response) {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  return res.json({ success: true });
}
