const express = require('express');
const router = express.Router();
const ctrl = require('./board.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

router.use(authenticate);

// Bildirişlər — hamı oxuyur, yalnız admin paylaşır/silir
router.get('/announcements', ctrl.getAnnouncements);
router.post('/announcements', requireAdmin, ctrl.createAnnouncement);
router.delete('/announcements/:id', requireAdmin, ctrl.deleteAnnouncement);

// Chat — hamı oxuyur və yazır (?peer=<id> → şəxsi yazışma)
router.get('/messages', ctrl.getMessages);
router.post('/messages', ctrl.postMessage);

// İnbox kontaktları (şəxsi yazışma üçün)
router.get('/contacts', ctrl.getContacts);

module.exports = router;
