const router = require('express').Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/projects — list all projects the user belongs to
router.get('/', authenticate, async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, pm.role
     FROM projects p
     JOIN project_members pm ON p.id = pm.project_id
     WHERE pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// POST /api/projects — create a project (creator becomes admin)
router.post('/', authenticate, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', req.user.id]
    );
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/projects/:projectId — project details + members
router.get('/:projectId', authenticate, async (req, res) => {
  const { projectId } = req.params;

  // Check membership
  const mem = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );
  if (!mem.rows.length) return res.status(403).json({ error: 'Not a member' });

  const project = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  const members = await db.query(
    `SELECT u.id, u.name, u.email, pm.role
     FROM project_members pm JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = $1`,
    [projectId]
  );

  res.json({ ...project.rows[0], members: members.rows, myRole: mem.rows[0].role });
});

// POST /api/projects/:projectId/members — add member (admin only)
router.post('/:projectId/members', authenticate, requireAdmin, async (req, res) => {
  const { email, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

  try {
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.projectId, user.rows[0].id, role]
    );
    res.json({ message: 'Member added' });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Already a member' });
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:projectId — delete project (admin only)
router.delete('/:projectId', authenticate, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
  res.json({ message: 'Project deleted' });
});

module.exports = router;
