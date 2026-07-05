import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const reminderSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reminderDate: { type: Date, required: true },
    note: { type: String },
    isDone: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type Reminder = InferSchemaType<typeof reminderSchema>;
export default mongoose.model<Reminder>('Reminder', reminderSchema);
