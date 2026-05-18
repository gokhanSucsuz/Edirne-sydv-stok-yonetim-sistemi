import mongoose, { Schema, Document } from 'mongoose';

export type UnitType = 'Vefa Temizlik' | 'Aşevi' | 'Dergah' | 'Bağış' | 'Vakıf';

export interface ITenderHistory {
  date: number;
  personnelId: string;
  personnelName: string;
  changes: string;
}

export interface IItem extends Document {
  unit: UnitType;
  name: string;
  measurementUnit: string;
  currentStock: number;
  createdAt: number;
  tenderId?: string;
  tenderName?: string;
  tenderEndDate?: number;
  tenderLimit?: number;
  tenderType?: 'İhale' | 'Bağış';
  tenderHistory?: ITenderHistory[];
  previousTenderStock?: number;
  totalReceived?: number;
}

const ItemSchema: Schema = new Schema({
  unit: { type: String, required: true },
  name: { type: String, required: true },
  measurementUnit: { type: String, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  createdAt: { type: Number, required: true, default: () => Date.now() },
  tenderId: { type: String },
  tenderName: { type: String },
  tenderEndDate: { type: Number },
  tenderLimit: { type: Number },
  tenderType: { type: String, enum: ['İhale', 'Bağış'] },
  tenderHistory: [{
    date: { type: Number },
    personnelId: { type: String },
    personnelName: { type: String },
    changes: { type: String }
  }],
  previousTenderStock: { type: Number },
  totalReceived: { type: Number, default: 0 }
});

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
