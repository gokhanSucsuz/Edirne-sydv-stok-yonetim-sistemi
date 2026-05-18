import mongoose, { Schema, Document } from 'mongoose';
import { UnitType } from './Item';

export type TransactionType = 'GİRİŞ' | 'ÇIKIŞ';

export interface ITransaction extends Document {
  itemId: string;
  unit: UnitType;
  type: TransactionType;
  quantity: number;
  remainingStock: number;
  date: number;
  personnelId: string;
  description: string;
  documentNo: string;
}

const TransactionSchema: Schema = new Schema({
  itemId: { type: String, required: true },
  unit: { type: String, required: true },
  type: { type: String, required: true, enum: ['GİRİŞ', 'ÇIKIŞ'] },
  quantity: { type: Number, required: true },
  remainingStock: { type: Number, required: true },
  date: { type: Number, required: true },
  personnelId: { type: String, required: true },
  description: { type: String },
  documentNo: { type: String, required: true }
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
