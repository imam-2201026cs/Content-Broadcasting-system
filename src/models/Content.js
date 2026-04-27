const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
  description: {
    type: String,
    default: null,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  file_url: {
    type: String,
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  file_type: {
    type: String,
    required: true,
  },
  file_size: {
    type: Number,
    required: true,
  },
  uploaded_by: {
    type: String,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['uploaded', 'pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejection_reason: {
    type: String,
    default: null,
  },
  approved_by: {
    type: String,
    ref: 'User',
    default: null,
  },
  approved_at: {
    type: Date,
    default: null,
  },
  start_time: {
    type: Date,
    default: null,
  },
  end_time: {
    type: Date,
    default: null,
  },
  rotation_duration: {
    type: Number,
    default: null,
  },
}, {
  collection: 'contents',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

contentSchema.virtual('id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Content', contentSchema);
