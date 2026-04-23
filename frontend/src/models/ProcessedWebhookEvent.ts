import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedWebhookEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  eventType: string;
  processedAt: Date;
}

const ProcessedWebhookEventSchema = new Schema<IProcessedWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

ProcessedWebhookEventSchema.index({ eventId: 1 }, { unique: true });

const ProcessedWebhookEvent: Model<IProcessedWebhookEvent> =
  (mongoose.models.ProcessedWebhookEvent as Model<IProcessedWebhookEvent>) ||
  mongoose.model<IProcessedWebhookEvent>('ProcessedWebhookEvent', ProcessedWebhookEventSchema);

export default ProcessedWebhookEvent;
