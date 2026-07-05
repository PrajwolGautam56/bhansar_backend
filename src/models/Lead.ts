import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const leadSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    designation: { type: String, trim: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    stage: { type: String, enum: ['NEW', 'INTERESTED', 'NEGOTIATING', 'ONBOARDING', 'CLIENT', 'LOST'], default: 'NEW' },
    lastCalledDate: { type: Date },
    nextCallDate: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    mutualPerson: { type: String, trim: true },
    relatedLeads: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
    relatedContacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

leadSchema.index({ fullName: 'text', phone: 'text', email: 'text', mutualPerson: 'text', remarks: 'text' });

export type Lead = InferSchemaType<typeof leadSchema>;
export default mongoose.model<Lead>('Lead', leadSchema);
