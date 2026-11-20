const paymentsService = require('./payments.service');

const getAll = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agent_id: req.query.agent_id,
      from: req.query.from,
      to: req.query.to,
    };
    const payments = await paymentsService.getPayments(req.user, filters);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportData = async (req, res) => {
  try {
    const { format, from, to } = req.query;
    const payments = await paymentsService.getPayments(req.user, { from, to });
    if (format === 'excel') {
      const workbook = await paymentsService.exportPaymentsExcel(payments);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=odenisler-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const pdf = await paymentsService.exportPaymentsPDF(payments);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=odenisler-${Date.now()}.pdf`);
      res.send(pdf);
    } else {
      res.status(400).json({ success: false, message: 'format=excel və ya format=pdf olmalıdır' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, payment_method } = req.body;
    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Yanlış status' });
    }
    const payment = await paymentsService.updatePaymentStatus(req.params.id, status, payment_method);
    res.json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await paymentsService.getPaymentStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, exportData, updateStatus, getStats };
