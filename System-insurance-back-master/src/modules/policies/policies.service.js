const db = require('../../config/db');
const { calculateWithRules, calculateCommission } = require('./pricing.engine');

const generatePolicyNumber = () => {
  const prefix = 'POL';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${year}-${random}`;
};

const getPolicies = async (user) => {
  // BUG DÜZƏLİŞİ: policies.* + users.id toqquşması → explicit sütunlar
  // BUG DÜZƏLİŞİ: N+1 query → payments LEFT JOIN ilə tək sorğu
  let query = db('policies')
    .join('users', 'policies.agent_id', 'users.id')
    .leftJoin('payments', 'policies.id', 'payments.policy_id')
    .select(
      'policies.id',
      'policies.agent_id',
      'policies.type',
      'policies.product',
      'policies.product_label',
      'policies.policy_number',
      'policies.customer_name',
      'policies.customer_phone',
      'policies.customer_email',
      'policies.premium_amount',
      'policies.commission_amount',
      'policies.start_date',
      'policies.end_date',
      'policies.status',
      'policies.notes',
      'policies.created_at',
      'users.name as agent_name',
      'users.email as agent_email',
      'payments.status as payment_status',
      'payments.id as payment_id'
    )
    .orderBy('policies.created_at', 'desc');

  if (user.role === 'agent' || user.role === 'subagent') {
    query = query.where('policies.agent_id', user.id);
  }

  return query;
};

const getPolicyById = async (id, user) => {
  let query = db('policies')
    .join('users', 'policies.agent_id', 'users.id')
    .select(
      'policies.id',
      'policies.agent_id',
      'policies.type',
      'policies.product',
      'policies.product_label',
      'policies.policy_number',
      'policies.customer_name',
      'policies.customer_phone',
      'policies.customer_email',
      'policies.premium_amount',
      'policies.commission_amount',
      'policies.start_date',
      'policies.end_date',
      'policies.status',
      'policies.notes',
      'policies.created_at',
      'users.name as agent_name'
    )
    .where('policies.id', id);

  if (user.role === 'agent' || user.role === 'subagent') {
    query = query.where('policies.agent_id', user.id);
  }

  const policy = await query.first();
  if (!policy) throw new Error('Sığorta tapılmadı');

  const details = await db('policy_details').where({ policy_id: id }).first();
  const payment = await db('payments').where({ policy_id: id }).first();
  // BUG DÜZƏLİŞİ: policy_id ilə filtr — başqa agentin komissiyası gəlməsin
  const commission = await db('commissions').where({ policy_id: id }).first();

  return { ...policy, details: details?.details, payment, commission };
};

// Məhsul (sub-type) → ümumi tip (auto/casco/property/travel)
const deriveType = (product, fallback) => {
  const p = String(product || '').toLowerCase();
  if (!p) return fallback || 'auto';
  if (p.includes('kasko') || p.includes('casco')) return 'casco';
  if (p.includes('sefer') || p.includes('səfər') || p.includes('travel') || p.includes('yasil_kart') || p.includes('yaşıl') || p.includes('ecnebi') || p.includes('səyahət')) return 'travel';
  if (p.includes('emlak') || p.includes('əmlak') || p.includes('yuvam') || p.includes('ev_esyalari') || p.includes('daşınmaz') || p.includes('dasinmaz') || p.includes('dəimmis') || p.includes('deimmis') || p.includes('qonsu') || p.includes('parkinq') || p.includes('evrika')) return 'property';
  return fallback || 'auto';
};

const createPolicy = async (data, user) => {
  const {
    type, customer_name, customer_phone, customer_email, start_date, end_date, details, notes,
    insurance_sub_type, product_label,
  } = data;

  const product = insurance_sub_type || null;
  const finalType = type || deriveType(product, 'auto');

  const priceResult = await calculateWithRules(finalType, details);
  // Qiymət mühərriki hesablaya bilməsə → formadakı final_premium/premium dəyərinə qayıt
  let premiumAmount = Number(priceResult.premium);
  if (!Number.isFinite(premiumAmount) || premiumAmount <= 0) {
    premiumAmount = Number(details?.final_premium) || Number(details?.premium) || Number(details?.annual_premium) || 0;
  }
  const commissionAmount = Number(calculateCommission(premiumAmount, user.commission_rate)) || 0;
  const policyNumber = generatePolicyNumber();

  const policyData = {
    agent_id: user.id,
    type: finalType,
    product,
    product_label: product_label || null,
    policy_number: policyNumber,
    customer_name,
    customer_phone,
    customer_email,
    premium_amount: premiumAmount,
    commission_amount: commissionAmount,
    start_date,
    end_date,
    notes,
    status: 'active',
  };

  const [policyId] = await db('policies').insert(policyData);
  await db('policy_details').insert({ policy_id: policyId, details: JSON.stringify(details) });
  await db('payments').insert({
    policy_id: policyId,
    amount: premiumAmount,
    status: 'pending',
    due_date: start_date,
  });
  await db('commissions').insert({
    agent_id: user.id,
    policy_id: policyId,
    amount: commissionAmount,
    status: 'pending',
  });

  return getPolicyById(policyId, { role: 'admin' });
};

const updatePolicy = async (id, data) => {
  const { status, notes, customer_phone, customer_email } = data;
  const update = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (customer_phone) update.customer_phone = customer_phone;
  if (customer_email) update.customer_email = customer_email;

  await db('policies').where({ id }).update(update);
  return getPolicyById(id, { role: 'admin' });
};

const deletePolicy = async (id) => {
  const policy = await db('policies').where({ id }).first();
  if (!policy) throw new Error('Sığorta tapılmadı');
  await db('policies').where({ id }).update({ status: 'cancelled' });
  return { message: 'Sığorta ləğv edildi' };
};

const calculatePreview = (type, details) => {
  const { calculate } = require('./pricing.engine');
  const premium = calculate(type, details);
  return { premium_amount: premium };
};

module.exports = { getPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy, calculatePreview };
