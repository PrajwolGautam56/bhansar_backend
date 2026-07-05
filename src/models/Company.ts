import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    district: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    importProducts: [{ type: String, trim: true }],
    importProductDetails: [
      {
        name: { type: String, required: true, trim: true },
        hsCode: { type: String, trim: true }
      }
    ],
    importFrequency: { type: String, enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'IRREGULAR'] },
    entryPort: { type: String, trim: true },
    currentServiceProvider: { type: String, trim: true },
    status: { type: String, enum: ['LEAD', 'INTERESTED', 'ACTIVE_CLIENT', 'INACTIVE'], default: 'LEAD' },
    notes: { type: String },
    workingSince: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', location: 'text', district: 'text' });

export type Company = InferSchemaType<typeof companySchema>;
export default mongoose.model<Company>('Company', companySchema);
