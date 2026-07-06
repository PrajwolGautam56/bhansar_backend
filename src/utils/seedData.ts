import dayjs from 'dayjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CallLog from '../models/CallLog.js';
import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import Lead from '../models/Lead.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';

dotenv.config();

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Lead.deleteMany({}),
    Contact.deleteMany({}),
    CallLog.deleteMany({}),
    Reminder.deleteMany({})
  ]);

  const [admin, agent] = await User.create([
    { name: 'AIMS Admin', email: 'admin@bhansarcrm.local', password: 'Admin@12345', role: 'ADMIN' },
    { name: 'Customs Agent', email: 'agent@bhansarcrm.local', password: 'Agent@12345', role: 'AGENT' }
  ]);

  const [companyA, companyB] = await Company.create([
    {
      name: 'Himalayan Imports Pvt. Ltd.',
      location: 'Kathmandu',
      district: 'Kathmandu',
      panNumber: '609123456',
      eximCode: 'EXIM-609123456',
      importProducts: ['Electronics', 'Mobile accessories'],
      importProductDetails: [
        { name: 'Electronics', hsCode: '8517' },
        { name: 'Mobile accessories', hsCode: '8518' }
      ],
      importFrequency: 'MONTHLY',
      entryPort: 'Birgunj Dry Port',
      currentServiceProvider: 'Independent clearing agent',
      importTransactions: [
        { startDate: dayjs().subtract(6, 'month').toDate(), endDate: dayjs().subtract(4, 'month').toDate(), amount: 5200000, currency: 'NPR', notes: 'Electronics shipment value' },
        { startDate: dayjs().subtract(3, 'month').toDate(), endDate: dayjs().subtract(1, 'month').toDate(), amount: 4700000, currency: 'NPR', notes: 'Mobile accessories shipment value' }
      ],
      status: 'INTERESTED',
      notes: 'Needs recurring clearance support.',
      createdBy: admin._id
    },
    {
      name: 'Terai Agro Traders',
      location: 'Biratnagar',
      district: 'Morang',
      panNumber: '304998112',
      eximCode: 'EXIM-304998112',
      importProducts: ['Fertilizer', 'Agro machinery'],
      importProductDetails: [
        { name: 'Fertilizer', hsCode: '3105' },
        { name: 'Agro machinery', hsCode: '' }
      ],
      importFrequency: 'QUARTERLY',
      entryPort: 'Biratnagar ICP',
      currentServiceProvider: 'In-house logistics team',
      importTransactions: [
        { startDate: dayjs().subtract(9, 'month').toDate(), endDate: dayjs().subtract(7, 'month').toDate(), amount: 3100000, currency: 'NPR', notes: 'Fertilizer import value' }
      ],
      status: 'LEAD',
      notes: 'Referral from existing client.',
      createdBy: admin._id
    }
  ]);

  const [leadA, leadB] = await Lead.create([
    {
      fullName: 'Suman Shrestha',
      phone: '+977-9841000001',
      email: 'suman@example.com',
      designation: 'Operations Manager',
      company: companyA._id,
      stage: 'INTERESTED',
      nextCallDate: dayjs().add(1, 'day').toDate(),
      assignedTo: agent._id,
      remarks: 'Asked for pricing details and handling timeline.',
      mutualPerson: 'Ramesh Adhikari',
      createdBy: admin._id
    },
    {
      fullName: 'Nisha Yadav',
      phone: '+977-9852000002',
      email: 'nisha@example.com',
      designation: 'Director',
      company: companyB._id,
      stage: 'NEW',
      nextCallDate: dayjs().subtract(1, 'day').toDate(),
      assignedTo: agent._id,
      remarks: 'First call pending.',
      mutualPerson: 'Prakash Thapa',
      createdBy: admin._id
    }
  ]);

  const contact = await Contact.create({
    fullName: 'Ramesh Adhikari',
    phone: '+977-9803000003',
    designation: 'Referral Partner',
    company: companyA._id,
    relationType: 'MUTUAL',
    linkedLeads: [leadA._id],
    notes: 'Knows the importer personally.'
  });

  leadA.relatedContacts = [contact._id];
  leadA.relatedLeads = [leadB._id];
  await leadA.save();

  await CallLog.create({
    lead: leadA._id,
    calledBy: agent._id,
    outcome: 'POSITIVE',
    remarks: 'Client wants a quote for monthly shipments.',
    nextAction: 'Send quotation and call again tomorrow.'
  });

  await Reminder.create([
    { lead: leadA._id, assignedTo: agent._id, reminderDate: dayjs().add(1, 'day').toDate(), note: 'Follow up on quote.' },
    { lead: leadB._id, assignedTo: agent._id, reminderDate: dayjs().subtract(1, 'day').toDate(), note: 'Initial discovery call.' }
  ]);

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
