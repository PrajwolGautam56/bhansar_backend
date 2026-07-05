import bcrypt from 'bcryptjs';
import mongoose, { Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';

export type UserRole = 'ADMIN' | 'AGENT';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN', 'AGENT'], default: 'AGENT' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.password);
};

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User> & {
  comparePassword(password: string): Promise<boolean>;
};

export default mongoose.model<User>('User', userSchema);
