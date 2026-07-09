const express = require('express');
const router = express.Router();
const ctrl = require('./bonuses.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

// Öz bonuslarım (agent/subagent/admin) — admin route-lardan ƏVVƏL olmalıdır
router.get('/me', authenticate, ctrl.listMine);

// Bonus idarəetməsi (yalnız admin)
router.get('/', authenticate, requireAdmin, ctrl.list);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.put('/:id', authenticate, requireAdmin, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
