const contentService = require('../services/contentService');
const schedulingService = require('../services/schedulingService');
const { User } = require('../models');
const fs = require('fs');

// POST /content/upload - Teacher uploads content
const uploadContent = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    const content = await contentService.uploadContent(req.user.id, req.body, req.file);
    res.status(201).json({ success: true, message: 'Content uploaded successfully', data: content });
  } catch (err) {
    // Clean up file if DB insert fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
};

// GET /content/my - Teacher views own content
const getMyContent = async (req, res, next) => {
  try {
    const result = await contentService.getTeacherContent(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /content/all - Principal views all content
const getAllContent = async (req, res, next) => {
  try {
    const result = await contentService.getAllContent(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /content/pending - Principal views pending content
const getPendingContent = async (req, res, next) => {
  try {
    const result = await contentService.getAllContent({ ...req.query, status: 'pending' });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// PATCH /content/:id/approve - Principal approves content
const approveContent = async (req, res, next) => {
  try {
    const content = await contentService.approveContent(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Content approved successfully', data: content });
  } catch (err) {
    next(err);
  }
};

// PATCH /content/:id/reject - Principal rejects content
const rejectContent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const content = await contentService.rejectContent(req.params.id, req.user.id, reason);
    res.status(200).json({ success: true, message: 'Content rejected', data: content });
  } catch (err) {
    next(err);
  }
};

// GET /content/live/:teacherId - Public broadcasting endpoint
const getLiveContent = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    // Validate teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      // Return empty response for invalid teacher (not error per spec)
      return res.status(200).json({
        success: true,
        message: 'No content available',
        data: null,
      });
    }

    let liveData;
    if (subject) {
      const content = await schedulingService.getLiveContentBySubject(teacherId, subject);
      liveData = content ? { [subject.toLowerCase().trim()]: content } : null;
    } else {
      liveData = await schedulingService.getLiveContent(teacherId);
    }

    if (!liveData || Object.keys(liveData).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No content available',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Live content fetched successfully',
      data: liveData,
    });
  } catch (err) {
    next(err);
  }
};

// GET /content/schedule - Teacher views their schedule
const getSchedule = async (req, res, next) => {
  try {
    const schedule = await schedulingService.getTeacherSchedule(req.user.id);
    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getLiveContent,
  getSchedule,
};
