const authService = require('./auth.service');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Düzgün email daxil edin'),
  password: z.string().min(1, 'Şifrə tələb olunur'),
});

const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(401).json({ success: false, message: err.message });
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: 'Çıxış edildi' });
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const getAgents = async (req, res) => {
  try {
    const agents = await authService.getAgents();
    res.json({ success: true, agents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await authService.getStaff();
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAgent = async (req, res) => {
  try {
    const agentSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      commission_rate: z.number().min(0).max(100).optional(),
      role: z.enum(['agent', 'subagent']).optional(),
      parent_agent_id: z.number().int().positive().optional(),
      companies: z.object({
        icbari: z.array(z.string()).optional(),
        konullu: z.array(z.string()).optional(),
      }).optional(),
      address: z.string().optional(),
      vezife: z.string().optional(),
      filial: z.string().optional(),
      phone: z.string().optional(),
      fin: z.string().optional(),
      sv: z.string().optional(),
      rating: z.number().int().min(0).max(5).optional(),
    });
    const data = agentSchema.parse(req.body);
    const agent = await authService.createAgent(data);
    res.status(201).json({ success: true, agent });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateAgent = async (req, res) => {
  try {
    const agent = await authService.updateAgent(req.params.id, req.body);
    res.json({ success: true, agent });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============ Şifrə bərpası ============
const requestReset = async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email('Düzgün email daxil edin') });
    const { email } = schema.parse(req.body);
    const result = await authService.requestPasswordReset(email);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const completeReset = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Düzgün email daxil edin'),
      password: z.string().min(6, 'Şifrə ən az 6 simvol olmalıdır'),
    });
    const { email, password } = schema.parse(req.body);
    await authService.completePasswordReset(email, password);
    res.json({ success: true, message: 'Şifrə uğurla dəyişdirildi' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(400).json({ success: false, message: err.message });
  }
};

const listResetRequests = async (req, res) => {
  try {
    const requests = await authService.listResetRequests();
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resolveReset = async (req, res) => {
  try {
    const action = req.body.action === 'approve' ? 'approve' : 'reject';
    const result = await authService.resolveReset(req.params.id, action);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  login, logout, getMe, getAgents, getStaff, createAgent, updateAgent,
  requestReset, completeReset, listResetRequests, resolveReset,
};
