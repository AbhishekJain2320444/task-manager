const jwt = require('jsonwebtoken');

// Verifies the JWT token and attaches user to req
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Checks if the user is an Admin in the given project
const requireAdmin = async (req, res, next) => {
  const db = require('../db');
  const { projectId } = req.params;

  const { rows } = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );

  if (!rows.length || rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
