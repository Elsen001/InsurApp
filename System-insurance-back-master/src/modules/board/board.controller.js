const boardService = require('./board.service');
const { z } = require('zod');

// ── Bildirişlər ──
const getAnnouncements = async (req, res) => {
  try {
    // Hər kəs öz auditoriyasına aid bildirişləri görür (admin hamısını)
    const announcements = await boardService.listAnnouncements(req.user.role);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      body: z.string().min(1, 'Mesaj boş ola bilməz'),
      audience: z.enum(['all', 'agent', 'subagent']).optional(),
    });
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
// ?peer=<id> verilibsə şəxsi yazışma, yoxsa ümumi söhbət
const getMessages = async (req, res) => {
  try {
    const peer = req.query.peer ? Number(req.query.peer) : null;
    const messages = await boardService.listMessages(req.user.id, peer);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const postMessage = async (req, res) => {
  try {
    const schema = z.object({
      body: z.string().min(1, 'Mesaj boş ola bilməz').max(1000),
      recipient_id: z.number().int().positive().optional(),
    });
    const { body, recipient_id } = schema.parse(req.body);
    const message = await boardService.postMessage(req.user.id, body, recipient_id || null);
    res.status(201).json({ success: true, message });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await boardService.listContacts(req.user.id);
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement, getMessages, postMessage, getContacts };
