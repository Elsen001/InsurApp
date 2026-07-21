const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const login = async (email, password) => {
  const user = await db('users').where({ email }).first();
  if (!user) throw new Error('Email və ya şifrə yanlışdır');
  if (!user.is_active) throw new Error('Hesabınız deaktiv edilib');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Email və ya şifrə yanlışdır');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      commission_rate: user.commission_rate,
    },
  };
};

const getMe = async (userId) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('İstifadəçi tapılmadı');
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const getAgents = async () => {
  // Ən yeni yaradılanlar əvvəldə
  const agents = await db('users')
    .where({ role: 'agent' })
    .select('id', 'name', 'email', 'commission_rate', 'is_active', 'created_at', 'address', 'vezife', 'filial', 'companies', 'fin', 'sv', 'rating')
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc');
  const subs = await db('users')
    .where({ role: 'subagent' })
    .select('id', 'name', 'email', 'role', 'commission_rate', 'is_active', 'parent_agent_id', 'created_at', 'address', 'vezife', 'filial', 'companies', 'fin', 'sv', 'rating')
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc');
  return agents.map((a) => ({
    ...a,
    subagents: subs.filter((s) => s.parent_agent_id === a.id),
  }));
};

// Bonus təyini üçün: bütün agent və subagentlər (düz siyahı)
const getStaff = async () => {
  return db('users')
    .whereIn('role', ['agent', 'subagent'])
    .andWhere({ is_active: true })
    .select('id', 'name', 'email', 'role', 'parent_agent_id', 'vezife', 'filial', 'address', 'fin', 'sv', 'rating')
    .orderBy('role', 'asc')
    .orderBy('name', 'asc');
};

const createAgent = async (data) => {
  const { name, email, password, commission_rate, role = 'agent', parent_agent_id = null, companies = null,
    address = null, vezife = null, filial = null, fin = null, sv = null, rating = 0 } = data;
  const exists = await db('users').where({ email }).first();
  if (exists) throw new Error('Bu email artıq istifadə olunur');
  if (role === 'subagent' && !parent_agent_id) {
    throw new Error('Subagent üçün valideyn agent seçilməlidir');
  }
  if (role === 'subagent') {
    const parent = await db('users').where({ id: parent_agent_id, role: 'agent' }).first();
    if (!parent) throw new Error('Seçilmiş valideyn agent tapılmadı');
  }
  const hashed = await bcrypt.hash(password, 10);
  const parentId = role === 'subagent' ? parent_agent_id : null;
  const [id] = await db('users').insert({
    name,
    email,
    password: hashed,
    role,
    parent_agent_id: parentId,
    commission_rate: commission_rate || 10,
    companies: companies ? JSON.stringify(companies) : null,
    address: address || null,
    vezife: vezife || null,
    filial: filial || null,
    fin: fin || null,
    sv: sv || null,
    rating: Number(rating) || 0,
  });
  return { id, name, email, role, parent_agent_id: parentId, commission_rate: commission_rate || 10, companies, address, vezife, filial, fin, sv, rating: Number(rating) || 0 };
};

const updateAgent = async (id, data) => {
  const { name, commission_rate, is_active, password, rating } = data;
  const update = {};
  if (name) update.name = name;
  if (commission_rate !== undefined) update.commission_rate = commission_rate;
  if (is_active !== undefined) update.is_active = is_active;
  if (rating !== undefined) update.rating = Math.max(0, Math.min(5, Number(rating) || 0));
  if (password) update.password = await bcrypt.hash(password, 10);
  await db('users').where({ id }).update(update);
  return getMe(id);
};

// ============ Şifrə bərpası (şifrəmi unutdum → admin təsdiqi → yeni şifrə) ============

// Agent/subagent şifrə sorğusu göndərir. Təsdiqlənmiş açıq sorğu varsa dərhal xəbər verilir.
const requestPasswordReset = async (email) => {
  const user = await db('users').where({ email }).first();
  if (!user) throw new Error('Bu email ilə istifadəçi tapılmadı');
  if (user.role === 'admin') throw new Error('Admin şifrəsi bu yolla dəyişdirilmir');

  // Artıq admin tərəfindən təsdiqlənmiş (istifadə olunmamış) sorğu varsa
  const approved = await db('password_resets')
    .where({ email, status: 'approved' })
    .orderBy('id', 'desc')
    .first();
  if (approved) return { status: 'approved' };

  // Gözləyən sorğu varsa təkrar yaratma
  const pending = await db('password_resets')
    .where({ email, status: 'pending' })
    .first();
  if (pending) return { status: 'pending' };

  await db('password_resets').insert({ user_id: user.id, email, status: 'pending' });
  return { status: 'pending' };
};

// Admin: sorğuların siyahısı (gözləyənlər əvvəldə)
const listResetRequests = async () => {
  return db('password_resets as pr')
    .join('users as u', 'u.id', 'pr.user_id')
    .whereIn('pr.status', ['pending', 'approved'])
    .select('pr.id', 'pr.status', 'pr.email', 'pr.created_at', 'u.name', 'u.role')
    .orderByRaw("FIELD(pr.status, 'pending', 'approved')")
    .orderBy('pr.created_at', 'desc');
};

// Admin: təsdiq / imtina
const resolveReset = async (id, action) => {
  const req = await db('password_resets').where({ id }).first();
  if (!req) throw new Error('Sorğu tapılmadı');
  if (req.status !== 'pending') throw new Error('Bu sorğu artıq cavablandırılıb');
  const status = action === 'approve' ? 'approved' : 'rejected';
  await db('password_resets').where({ id }).update({ status, resolved_at: db.fn.now() });
  return { id, status };
};

// Təsdiqlənmiş sorğu varsa yeni şifrə təyin edilir və sorğu bağlanır
const completePasswordReset = async (email, newPassword) => {
  const req = await db('password_resets')
    .where({ email, status: 'approved' })
    .orderBy('id', 'desc')
    .first();
  if (!req) throw new Error('Təsdiqlənmiş sorğu yoxdur. Əvvəlcə admin təsdiqini gözləyin');
  const hashed = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: req.user_id }).update({ password: hashed });
  await db('password_resets').where({ id: req.id }).update({ status: 'used', resolved_at: db.fn.now() });
  return { success: true };
};

module.exports = {
  login, getMe, getAgents, getStaff, createAgent, updateAgent,
  requestPasswordReset, listResetRequests, resolveReset, completePasswordReset,
};
