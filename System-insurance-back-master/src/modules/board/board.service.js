const db = require('../../config/db');

// ── Bildirişlər (announcements) ──
// role verilibsə, yalnız həmin auditoriyaya aid bildirişlər qaytarılır
// (admin hamısını görür)
const listAnnouncements = async (role) => {
  const q = db('announcements')
    .leftJoin('users', 'announcements.created_by', 'users.id')
    .select('announcements.id', 'announcements.title', 'announcements.body', 'announcements.audience', 'announcements.created_at', 'users.name as author')
    .orderBy('announcements.created_at', 'desc')
    .limit(50);

  if (role === 'agent' || role === 'subagent') {
    q.whereIn('announcements.audience', ['all', role]);
  }
  return q;
};

const createAnnouncement = async ({ title, body, audience = 'all' }, adminId) => {
  const [id] = await db('announcements').insert({
    title: title || null,
    body,
    audience,
    created_by: adminId || null,
  });
  return db('announcements').where({ id }).first();
};

const deleteAnnouncement = async (id) => {
  await db('announcements').where({ id }).del();
  return { deleted: true };
};

// ── Chat ──
const MSG_COLS = [
  'chat_messages.id', 'chat_messages.user_id', 'chat_messages.recipient_id',
  'chat_messages.body', 'chat_messages.created_at',
  'chat_messages.attachment_url', 'chat_messages.attachment_name', 'chat_messages.attachment_type',
  'users.name as user_name', 'users.role as user_role',
];

// peerId verilibsə → yalnız həmin şəxslə şəxsi yazışma, yoxsa ümumi söhbət
const listMessages = async (userId, peerId) => {
  let q = db('chat_messages')
    .join('users', 'chat_messages.user_id', 'users.id')
    .select(MSG_COLS)
    .orderBy('chat_messages.created_at', 'desc')
    .limit(100);

  if (peerId) {
    q = q.where(function () {
      this.where(function () {
        this.where('chat_messages.user_id', userId).andWhere('chat_messages.recipient_id', peerId);
      }).orWhere(function () {
        this.where('chat_messages.user_id', peerId).andWhere('chat_messages.recipient_id', userId);
      });
    });
  } else {
    q = q.whereNull('chat_messages.recipient_id');
  }

  const rows = await q;
  return rows.reverse(); // köhnədən yeniyə
};

const postMessage = async (userId, body, recipientId = null, attachment = null) => {
  const [id] = await db('chat_messages').insert({
    user_id: userId,
    body: body || null,
    recipient_id: recipientId || null,
    attachment_url: attachment?.url || null,
    attachment_name: attachment?.name || null,
    attachment_type: attachment?.type || null,
  });
  return db('chat_messages')
    .join('users', 'chat_messages.user_id', 'users.id')
    .select(MSG_COLS)
    .where('chat_messages.id', id)
    .first();
};

// İnbox üçün kontaktlar: bütün aktiv istifadəçilər + hər biri ilə son şəxsi mesaj
const listContacts = async (userId) => {
  const users = await db('users')
    .whereNot('id', userId)
    .andWhere({ is_active: true })
    .select('id', 'name', 'role')
    .orderBy('name', 'asc');

  const dms = await db('chat_messages')
    .whereNotNull('recipient_id')
    .andWhere(function () {
      this.where('user_id', userId).orWhere('recipient_id', userId);
    })
    .select('id', 'user_id', 'recipient_id', 'body', 'attachment_name', 'created_at')
    .orderBy('id', 'asc');

  const lastByPeer = {};
  for (const m of dms) {
    const peer = m.user_id === userId ? m.recipient_id : m.user_id;
    lastByPeer[peer] = {
      last_message_id: m.id,
      last_body: m.body || (m.attachment_name ? `📎 ${m.attachment_name}` : ''),
      last_at: m.created_at,
      last_from_me: m.user_id === userId,
    };
  }

  return users.map((u) => ({ ...u, ...(lastByPeer[u.id] || {}) }));
};

module.exports = { listAnnouncements, createAnnouncement, deleteAnnouncement, listMessages, postMessage, listContacts };
