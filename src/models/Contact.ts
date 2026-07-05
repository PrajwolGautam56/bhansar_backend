import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const contactSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    designation: { type: String, trim: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    relationType: { type: String, enum: ['LEAD_CONTACT', 'MUTUAL', 'CLIENT_REFERRAL'], default: 'LEAD_CONTACT' },
    linkedLeads: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
    notes: { type: String }
  },
  { timestamps: true }
);

contactSchema.index({ fullName: 'text', phone: 'text', email: 'text', notes: 'text' });

export type Contact = InferSchemaType<typeof contactSchema>;
export default mongoose.model<Contact>('Contact', contactSchema);
