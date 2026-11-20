const db = require('../../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const updateOverduePayments = async () => {
  const today = new Date().toISOString().split('T')[0];
  await db('payments')
    .where('status', 'pending')
    .where('due_date', '<', today)
    .update({ status: 'overdue' });
};

const getPayments = async (user, filters = {}) => {
  await updateOverduePayments();

  let query = db('payments')
    .join('policies', 'payments.policy_id', 'policies.id')
    .join('users', 'policies.agent_id', 'users.id')
    .select(
      'payments.*',
      'policies.policy_number',
      'policies.type as policy_type',
      'policies.product as policy_product',
      'policies.product_label as policy_product_label',
      'policies.status as policy_status',
      'policies.start_date as policy_start_date',
      'policies.customer_name',
      'users.name as agent_name',
      'users.id as agent_id'
    )
    .orderBy('payments.due_date', 'asc');

  if (user.role === 'agent' || user.role === 'subagent') {
    query = query.where('policies.agent_id', user.id);
  }

  if (filters.status) query = query.where('payments.status', filters.status);
  if (filters.agent_id && user.role === 'admin') query = query.where('policies.agent_id', filters.agent_id);
  if (filters.from) query = query.where('payments.due_date', '>=', filters.from);
  if (filters.to) query = query.where('payments.due_date', '<=', filters.to);

  return query;
};

const updatePaymentStatus = async (id, status, payment_method) => {
  const payment = await db('payments').where({ id }).first();
  if (!payment) throw new Error('Ödəniş tapılmadı');

  const update = { status };
  if (status === 'paid') {
    update.paid_at = new Date();
    if (payment_method) update.payment_method = payment_method;
    // Komissiyanı da ödənilmiş kimi işarələ
    await db('commissions').where({ policy_id: payment.policy_id }).update({ status: 'paid', paid_at: new Date() });
  }

  await db('payments').where({ id }).update(update);
  return db('payments').where({ id }).first();
};

const getPaymentStats = async () => {
  await updateOverduePayments();
  const stats = await db('payments')
    .select('status')
    .count('* as count')
    .sum('amount as total')
    .groupBy('status');
  return stats;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = String(value).slice(0, 10);
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : new Date(value).toLocaleDateString('az-AZ');
};

const exportPaymentsExcel = async (payments) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ödənişlər');
  sheet.columns = [
    { header: 'Sığorta №', key: 'policy_number', width: 20 },
    { header: 'Müştəri', key: 'customer_name', width: 25 },
    { header: 'Sığorta növü', key: 'product', width: 36 },
    { header: 'Sığorta haqqı (AZN)', key: 'amount', width: 20 },
    { header: 'Ödəniş tarixi', key: 'due_date', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Agent', key: 'agent_name', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  const statusLabels = { pending: 'Gözləyir', paid: 'Ödənilib', overdue: 'Gecikmiş' };
  payments.forEach((payment) => {
    sheet.addRow({
      policy_number: payment.policy_number,
      customer_name: payment.customer_name,
      product: payment.policy_product_label || payment.policy_product || payment.policy_type,
      amount: Number(payment.amount) || 0,
      due_date: formatDate(payment.due_date),
      status: statusLabels[payment.status] || payment.status,
      agent_name: payment.agent_name,
    });
  });
  sheet.getColumn('D').numFmt = '#,##0.00';
  return workbook;
};

const exportPaymentsPDF = (payments) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const buffers = [];
  doc.on('data', (buffer) => buffers.push(buffer));
  doc.on('end', () => resolve(Buffer.concat(buffers)));
  doc.on('error', reject);
  doc.fontSize(18).text('Ödənişlər', { align: 'center' });
  doc.fontSize(10).text(`Tarix: ${formatDate(new Date())} · Cəmi: ${payments.length}`, { align: 'center' });
  doc.moveDown();
  payments.forEach((payment, index) => {
    if (doc.y > 520) doc.addPage();
    const product = payment.policy_product_label || payment.policy_product || payment.policy_type || '—';
    const status = { pending: 'Gözləyir', paid: 'Ödənilib', overdue: 'Gecikmiş' }[payment.status] || payment.status;
    doc.fontSize(9).text(
      `${index + 1}. ${payment.policy_number} | ${payment.customer_name} | ${product} | ` +
      `${Number(payment.amount || 0).toFixed(2)} AZN | ${formatDate(payment.due_date)} | ${status}`
    );
  });
  doc.end();
});

module.exports = {
  getPayments, updatePaymentStatus, getPaymentStats, updateOverduePayments,
  exportPaymentsExcel, exportPaymentsPDF,
};
