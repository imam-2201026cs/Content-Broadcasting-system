const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentScheduleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  content_id: {
    type: String,
    ref: 'Content',
    required: true,
  },
  slot_id: {
    type: String,
    ref: 'ContentSlot',
    required: true,
  },
  rotation_order: {
    type: Number,
    required: true,
    default: 0,
  },
  duration: {
    type: Number,
    required: true,
    default: 5,
  },
}, {
  collection: 'content_schedules',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

contentScheduleSchema.virtual('id').get(function() {
  return this._id;
});

module.exports = mongoose.model('ContentSchedule', contentScheduleSchema);
