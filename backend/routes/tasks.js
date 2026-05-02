const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Helper: check project membership
const isMember = async (projectId, userId) => {
  const { rows } = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return rows[0] || null;
};

// GET /api/projects/:projectId/tasks
router.get('/', authenticate, async (req, res) => {
  const mem = await isMember(req.params.projectId, req.user.id);
  if (!mem) return res.status(403).json({ error: 'Not a member' });

  const { rows } = await db.query(
    `SELECT t.*, u.name AS assignee_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [req.params.projectId]
  );
  res.json(rows);
});

// POST /api/projects/:projectId/tasks — create task
router.post('/', authenticate, async (req, res) => {
  const mem = await isMember(req.params.projectId, req.user.id);
  if (!mem) return res.status(403).json({ error: 'Not a member' });

  const { title, description, assignee_id, due_date, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const { rows } = await db.query(
    `INSERT INTO tasks (project_id, title, description, assignee_id, due_date, priority, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.params.projectId, title, description || '', assignee_id || null,
     due_date || null, priority || 'medium', req.user.id]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/projects/:projectId/tasks/:taskId — update status / fields
router.patch('/:taskId', authenticate, async (req, res) => {
  const mem = await isMember(req.params.projectId, req.user.id);
  if (!mem) return res.status(403).json({ error: 'Not a member' });

  const { status, title, description, assignee_id, due_date, priority } = req.body;
  const { rows } = await db.query(
    `UPDATE tasks SET
       status      = COALESCE($1, status),
       title       = COALESCE($2, title),
       description = COALESCE($3, description),
       assignee_id = COALESCE($4, assignee_id),
       due_date    = COALESCE($5, due_date),
       priority    = COALESCE($6, priority)
     WHERE id = $7 AND project_id = $8
     RETURNING *`,
    [status, title, description, assignee_id, due_date, priority,
     req.params.taskId, req.params.projectId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found' });
  res.json(rows[0]);
});

// DELETE /api/projects/:projectId/tasks/:taskId (admin or creator)
router.delete('/:taskId', authenticate, async (req, res) => {
  const mem = await isMember(req.params.projectId, req.user.id);
  if (!mem) return res.status(403).json({ error: 'Not a member' });

  const task = await db.query(
    'SELECT created_by FROM tasks WHERE id = $1 AND project_id = $2',
    [req.params.taskId, req.params.projectId]
  );
  if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

  if (mem.role !== 'admin' && task.rows[0].created_by !== req.user.id)
    return res.status(403).json({ error: 'Not allowed' });

  await db.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
