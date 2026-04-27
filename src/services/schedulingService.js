const { Content, ContentSlot, ContentSchedule, User } = require('../models');

const CYCLE_EPOCH = new Date('2024-01-01T00:00:00.000Z');

/**
 * Get live content for a specific teacher
 */
const getLiveContent = async (teacherId) => {
  const now = new Date();

  // Get all approved content by teacher that's within active time window
  const activeContents = await Content.find({
    uploaded_by: teacherId,
    status: 'approved',
    start_time: { $lte: now },
    end_time: { $gte: now },
  }).sort({ created_at: 1 });

  if (!activeContents || activeContents.length === 0) {
    return null;
  }

  // Group content by subject
  const subjectGroups = {};
  for (const content of activeContents) {
    const subject = content.subject;
    if (!subjectGroups[subject]) {
      subjectGroups[subject] = [];
    }

    // Fetch schedule for this content
    const schedule = await ContentSchedule.findOne({ content_id: content._id });
    
    subjectGroups[subject].push({
      content,
      rotation_order: schedule ? schedule.rotation_order : 0,
      duration: schedule ? schedule.duration : 5,
    });
  }

  // For each subject, determine which content is currently active
  const liveBySubject = {};
  for (const [subject, items] of Object.entries(subjectGroups)) {
    // Sort by rotation_order
    items.sort((a, b) => a.rotation_order - b.rotation_order);

    const active = getActiveContentForSubject(items, now);
    if (active) {
      liveBySubject[subject] = active;
    }
  }

  if (Object.keys(liveBySubject).length === 0) {
    return null;
  }

  return liveBySubject;
};

/**
 * Determine which content is active right now
 */
const getActiveContentForSubject = (items, now) => {
  if (!items || items.length === 0) return null;
  if (items.length === 1) return items[0].content;

  const totalCycleMs = items.reduce((sum, item) => sum + item.duration * 60 * 1000, 0);
  if (totalCycleMs === 0) return items[0].content;

  const elapsedMs = (now.getTime() - CYCLE_EPOCH.getTime()) % totalCycleMs;

  let cursor = 0;
  for (const item of items) {
    const durationMs = item.duration * 60 * 1000;
    if (elapsedMs >= cursor && elapsedMs < cursor + durationMs) {
      return item.content;
    }
    cursor += durationMs;
  }

  return items[0].content;
};

/**
 * Get live content for a teacher filtered by subject
 */
const getLiveContentBySubject = async (teacherId, subject) => {
  const liveContent = await getLiveContent(teacherId);
  if (!liveContent) return null;

  const subjectKey = subject.toLowerCase().trim();
  return liveContent[subjectKey] || null;
};

/**
 * Get schedule info for a teacher
 */
const getTeacherSchedule = async (teacherId) => {
  const slots = await ContentSlot.find({ teacher_id: teacherId });
  
  const result = [];
  for (const slot of slots) {
    const schedules = await ContentSchedule.find({ slot_id: slot._id })
      .populate({
        path: 'content_id',
        match: { status: 'approved' }
      })
      .sort({ rotation_order: 1 });
    
    // Convert to plain object to match expected output structure
    const slotObj = slot.toObject();
    slotObj.schedules = schedules.filter(s => s.content_id).map(s => {
      const sObj = s.toObject();
      sObj.content = sObj.content_id; // Match frontend expectation
      return sObj;
    });
    
    result.push(slotObj);
  }

  return result;
};

module.exports = { getLiveContent, getLiveContentBySubject, getTeacherSchedule };
