import mongoose, { Schema, Document } from 'mongoose';

export interface IMasterItem extends Document {
  name: string;
  measurementUnit: string;
  createdAt: number;
}

const MasterItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  measurementUnit: { type: String, required: true },
  createdAt: { type: Number, required: true, default: () => Date.now() }
});

export default mongoose.models.MasterItem || mongoose.model<IMasterItem>('MasterItem', MasterItemSchema);
