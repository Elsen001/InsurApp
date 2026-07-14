const boardService = require('./board.service');
const { z } = require('zod');

// ── Bildirişlər ──
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await boardService.listAnnouncements();
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const schema = z.object({ title: z.string().optional(), body: z.string().min(1, 'Mesaj boş ola bilməz') });
    const data = schema.parse(req.body);
    const announcement = await boardService.createAnnouncement(data, req.user.id);
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const result = await boardService.deleteAnnouncement(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Chat ──
const getMessages = async (req, res) => {
  try {
    const messages = await boardService.listMessages();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const postMessage = async (req, res) => {
  try {
    const schema = z.object({ body: z.string().min(1, 'Mesaj boş ola bilməz').max(1000) });
    const { body } = schema.parse(req.body);
    const message = await boardService.postMessage(req.user.id, body);
    res.status(201).json({ success: true, message });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement, getMessages, postMessage };
