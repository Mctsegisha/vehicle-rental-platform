import { query } from '../config/db';

const mapNotification = (dbN: any) => ({
  id: dbN.notification_id,
  userId: dbN.user_id,
  title: dbN.title,
  message: dbN.message,
  type: dbN.type || 'info',
  isRead: dbN.is_read || false,
  createdAt: dbN.created_at
});

export const getMyNotifications = async (req: any, res: any) => {
  try {
    const result = await query(
      'SELECT * FROM Notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows.map(mapNotification));
  } catch (err: any) {
    console.error('[Notification Controller] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const markNotificationAsRead = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const search = await query(
      'SELECT user_id FROM Notifications WHERE notification_id = $1',
      [id]
    );
    if (search.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (String(search.rows[0].user_id) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const markAllNotificationsRead = async (req: any, res: any) => {
  try {
    await query(
      'UPDATE Notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteNotification = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const search = await query(
      'SELECT user_id FROM Notifications WHERE notification_id = $1',
      [id]
    );
    if (search.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (String(search.rows[0].user_id) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await query(
      'DELETE FROM Notifications WHERE notification_id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
