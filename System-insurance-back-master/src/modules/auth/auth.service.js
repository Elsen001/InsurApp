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
    .select('id', 'name', 'email', 'commission_rate', 'is_active', 'parent_agent_id', 'created_at', 'address', 'vezife', 'filial', 'companies', 'fin', 'sv', 'rating')
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
  const { name, commission_rate, is_active, password } = data;
  const update = {};
  if (name) update.name = name;
  if (commission_rate !== undefined) update.commission_rate = commission_rate;
  if (is_active !== undefined) update.is_active = is_active;
  if (password) update.password = await bcrypt.hash(password, 10);
  await db('users').where({ id }).update(update);
  return getMe(id);
};

module.exports = { login, getMe, getAgents, getStaff, createAgent, updateAgent };
