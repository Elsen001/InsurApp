const express = require('express');
const router = express.Router();
const ctrl = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

// Öz hesabatım (agent/subagent/admin) — admin guard-dan ƏVVƏL
router.get('/my', authenticate, ctrl.getMyReport);
router.get('/my/export', authenticate, ctrl.exportMyData);

// Aşağıdakılar yalnız admin
router.use(authenticate, requireAdmin);

router.get('/agents/export', ctrl.exportAgentsList);
router.get('/summary', ctrl.getSummary);
router.get('/product-drilldown', ctrl.getProductDrilldown);
router.get('/agent/:id', ctrl.getAgentReport);
router.get('/agent/:id/export', ctrl.exportAgentData);
router.get('/export', ctrl.exportData);

module.exports = router;
