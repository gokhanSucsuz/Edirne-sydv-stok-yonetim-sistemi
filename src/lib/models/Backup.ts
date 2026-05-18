import mongoose, { Schema, Document } from 'mongoose';

export interface IBackup extends Document {
  fileName: string;
  createdAt: number;
  data: any;
}

const BackupSchema: Schema = new Schema({
  fileName: { type: String, required: true },
  createdAt: { type: Number, required: true, default: () => Date.now() },
  data: { type: Schema.Types.Mixed, required: true }
});

export default mongoose.models.Backup || mongoose.model<IBackup>('Backup', BackupSchema);
