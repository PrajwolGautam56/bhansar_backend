import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const callLogSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    calledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calledAt: { type: Date, default: Date.now },
    callDurationSeconds: { type: Number, min: 0 },
    outcome: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_ANSWER'], default: 'NEUTRAL' },
    remarks: { type: String },
    nextAction: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type CallLog = InferSchemaType<typeof callLogSchema>;
export default mongoose.model<CallLog>('CallLog', callLogSchema);
