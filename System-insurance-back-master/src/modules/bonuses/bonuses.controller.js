const bonusesService = require('./bonuses.service');
const { z } = require('zod');

const bonusSchema = z.object({
  user_id: z.number().int().positive(),
  product: z.string().min(1),
  product_label: z.string().min(1),
  percent: z.number().min(0).max(100),
  note: z.string().optional(),
});

// Admin: bütün bonuslar
const list = async (req, res) => {
  try {
    const bonuses = await bonusesService.list();
    res.json({ success: true, bonuses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Agent/subagent: öz bonusları
const listMine = async (req, res) => {
  try {
    const bonuses = await bonusesService.listByUser(req.user.id);
    res.json({ success: true, bonuses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const data = bonusSchema.parse(req.body);
    const bonus = await bonusesService.create(data, req.user.id);
    res.status(201).json({ success: true, bonus });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const bonus = await bonusesService.update(req.params.id, req.body);
    res.json({ success: true, bonus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await bonusesService.remove(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { list, listMine, create, update, remove };
