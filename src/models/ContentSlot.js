const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentSlotSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  teacher_id: {
    type: String,
    ref: 'User',
    required: true,
  },
}, {
  collection: 'content_slots',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

contentSlotSchema.virtual('id').get(function() {
  return this._id;
});

module.exports = mongoose.model('ContentSlot', contentSlotSchema);
