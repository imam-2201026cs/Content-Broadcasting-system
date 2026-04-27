const path = require('path');
const { Content, ContentSlot, ContentSchedule, User } = require('../models');

/**
 * Upload new content (Teacher)
 */
const uploadContent = async (teacherId, body, file) => {
  const { title, description, subject, start_time, end_time, rotation_duration } = body;

  const content = await Content.create({
    title,
    description: description || null,
    subject: subject.toLowerCase().trim(),
    file_url: `/uploads/${file.filename}`,
    file_path: file.path,
    file_type: path.extname(file.originalname).toLowerCase().replace('.', ''),
    file_size: file.size,
    uploaded_by: teacherId,
    status: 'pending',
    start_time: start_time || null,
    end_time: end_time || null,
    rotation_duration: rotation_duration ? parseInt(rotation_duration) : null,
  });

  return content;
};

/**
 * Get teacher's own content with optional filters
 */
const getTeacherContent = async (teacherId, { status, subject, page = 1, limit = 10 }) => {
  const query = { uploaded_by: teacherId };
  if (status) query.status = status;
  if (subject) query.subject = subject.toLowerCase().trim();

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const count = await Content.countDocuments(query);
  const rows = await Content.find(query)
    .populate({ path: 'approved_by', select: 'id name email', model: 'User' })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  return {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / parseInt(limit)),
    data: rows,
  };
};

/**
 * Get all content (Principal)
 */
const getAllContent = async ({ status, subject, teacher_id, page = 1, limit = 10 }) => {
  const query = {};
  if (status) query.status = status;
  if (subject) query.subject = subject.toLowerCase().trim();
  if (teacher_id) query.uploaded_by = teacher_id;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const count = await Content.countDocuments(query);
  const rows = await Content.find(query)
    .populate({ path: 'uploaded_by', select: 'id name email', model: 'User' })
    .populate({ path: 'approved_by', select: 'id name email', model: 'User' })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  return {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / parseInt(limit)),
    data: rows,
  };
};

/**
 * Approve content (Principal)
 */
const approveContent = async (contentId, principalId) => {
  const content = await Content.findById(contentId);
  if (!content) {
    const err = new Error('Content not found');
    err.statusCode = 404;
    throw err;
  }
  if (content.status === 'approved') {
    const err = new Error('Content is already approved');
    err.statusCode = 400;
    throw err;
  }

  content.status = 'approved';
  content.approved_by = principalId;
  content.approved_at = new Date();
  content.rejection_reason = null;
  await content.save();

  // Auto-create scheduling slot if not exists
  await ensureSlot(content);

  return content;
};

/**
 * Reject content (Principal)
 */
const rejectContent = async (contentId, principalId, reason) => {
  if (!reason || reason.trim().length === 0) {
    const err = new Error('Rejection reason is required');
    err.statusCode = 400;
    throw err;
  }

  const content = await Content.findById(contentId);
  if (!content) {
    const err = new Error('Content not found');
    err.statusCode = 404;
    throw err;
  }
  if (content.status === 'rejected') {
    const err = new Error('Content is already rejected');
    err.statusCode = 400;
    throw err;
  }

  content.status = 'rejected';
  content.rejection_reason = reason.trim();
  content.approved_by = principalId;
  content.approved_at = new Date();
  await content.save();

  return content;
};

/**
 * Ensure a ContentSlot exists for this teacher + subject, and add content to schedule
 */
const ensureSlot = async (content) => {
  let slot = await ContentSlot.findOne({
    teacher_id: content.uploaded_by,
    subject: content.subject,
  });

  if (!slot) {
    slot = await ContentSlot.create({
      teacher_id: content.uploaded_by,
      subject: content.subject,
    });
  }

  // Find max rotation_order in this slot
  const lastSchedule = await ContentSchedule.findOne({ slot_id: slot._id })
    .sort({ rotation_order: -1 });
  
  const nextOrder = (lastSchedule ? lastSchedule.rotation_order : 0) + 1;

  // Check if schedule already exists
  const existingSchedule = await ContentSchedule.findOne({
    content_id: content._id,
    slot_id: slot._id,
  });

  if (!existingSchedule) {
    await ContentSchedule.create({
      content_id: content._id,
      slot_id: slot._id,
      rotation_order: nextOrder,
      duration: content.rotation_duration || 5,
    });
  }
};

module.exports = { uploadContent, getTeacherContent, getAllContent, approveContent, rejectContent };
