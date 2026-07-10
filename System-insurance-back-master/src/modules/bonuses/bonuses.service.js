const db = require('../../config/db');

// Bütün bonuslar (admin) — istifadəçi məlumatı ilə
const list = async () => {
  return db('bonuses')
    .join('users', 'bonuses.user_id', 'users.id')
    .select(
      'bonuses.id',
      'bonuses.user_id',
      'bonuses.product',
      'bonuses.product_label',
      'bonuses.percent',
      'bonuses.note',
      'bonuses.created_at',
      'users.name as user_name',
      'users.role as user_role'
    )
    .orderBy('bonuses.created_at', 'desc');
};

// Bir istifadəçinin öz bonusları
const listByUser = async (userId) => {
  return db('bonuses')
    .where({ user_id: userId })
    .select('id', 'product', 'product_label', 'percent', 'note', 'created_at', 'updated_at')
    .orderBy('product_label', 'asc');
};

// Bonus yarat / yenilə (user_id + product unikaldır → upsert)
const create = async (data, adminId) => {
  const { user_id, product, product_label, percent, note } = data;

  const user = await db('users').where({ id: user_id }).whereIn('role', ['agent', 'subagent']).first();
  if (!user) throw new Error('Bonus yalnız agent və ya subagentə təyin oluna bilər');

  const existing = await db('bonuses').where({ user_id, product }).first();
  if (existing) {
    await db('bonuses').where({ id: existing.id }).update({ product_label, percent, note: note || null });
    return db('bonuses').where({ id: existing.id }).first();
  }

  const [id] = await db('bonuses').insert({
    user_id,
    product,
    product_label,
    percent,
    note: note || null,
    created_by: adminId || null,
  });
  return db('bonuses').where({ id }).first();
};

const update = async (id, data) => {
  const { percent, note, product_label } = data;
  const patch = {};
  if (percent !== undefined) patch.percent = percent;
  if (note !== undefined) patch.note = note || null;
  if (product_label !== undefined) patch.product_label = product_label;
  await db('bonuses').where({ id }).update(patch);
  return db('bonuses').where({ id }).first();
};

const remove = async (id) => {
  await db('bonuses').where({ id }).del();
  return { deleted: true };
};

module.exports = { list, listByUser, create, update, remove };
