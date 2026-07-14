const db = require('../../config/db');

// ── Bildirişlər (announcements) ──
const listAnnouncements = async () => {
  return db('announcements')
    .leftJoin('users', 'announcements.created_by', 'users.id')
    .select('announcements.id', 'announcements.title', 'announcements.body', 'announcements.created_at', 'users.name as author')
    .orderBy('announcements.created_at', 'desc')
    .limit(50);
};

const createAnnouncement = async ({ title, body }, adminId) => {
  const [id] = await db('announcements').insert({ title: title || null, body, created_by: adminId || null });
  return db('announcements').where({ id }).first();
};

const deleteAnnouncement = async (id) => {
  await db('announcements').where({ id }).del();
  return { deleted: true };
};

// ── Chat ──
const listMessages = async () => {
  const rows = await db('chat_messages')
    .join('users', 'chat_messages.user_id', 'users.id')
    .select('chat_messages.id', 'chat_messages.user_id', 'chat_messages.body', 'chat_messages.created_at', 'users.name as user_name', 'users.role as user_role')
    .orderBy('chat_messages.created_at', 'desc')
    .limit(100);
  return rows.reverse(); // köhnədən yeniyə
};

const postMessage = async (userId, body) => {
  const [id] = await db('chat_messages').insert({ user_id: userId, body });
  return db('chat_messages')
    .join('users', 'chat_messages.user_id', 'users.id')
    .select('chat_messages.id', 'chat_messages.user_id', 'chat_messages.body', 'chat_messages.created_at', 'users.name as user_name', 'users.role as user_role')
    .where('chat_messages.id', id)
    .first();
};

module.exports = { listAnnouncements, createAnnouncement, deleteAnnouncement, listMessages, postMessage };
