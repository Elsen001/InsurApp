const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

router.post('/login', ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);

// Şifrə bərpası — açıq (login-siz)
router.post('/password-reset/request', ctrl.requestReset);
router.post('/password-reset/complete', ctrl.completeReset);
// Şifrə bərpası — admin idarəetməsi
router.get('/password-reset/requests', authenticate, requireAdmin, ctrl.listResetRequests);
router.put('/password-reset/:id', authenticate, requireAdmin, ctrl.resolveReset);

// Agent / subagent idarəetməsi (yalnız admin)
router.get('/agents', authenticate, requireAdmin, ctrl.getAgents);
router.get('/staff', authenticate, requireAdmin, ctrl.getStaff);
router.post('/agents', authenticate, requireAdmin, ctrl.createAgent);
router.put('/agents/:id', authenticate, requireAdmin, ctrl.updateAgent);

module.exports = router;
