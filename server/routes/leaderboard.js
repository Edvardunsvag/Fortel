import { pool } from '../db/init.js';

/**
 * Get leaderboard for current day
 * 
 * GET /api/leaderboard
 * Query params: ?date=YYYY-MM-DD (optional, defaults to today)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT player_name, score, avatar_image_url, created_at
         FROM leaderboard
         WHERE date = $1
         ORDER BY score ASC, created_at ASC
         LIMIT 100`,
        [date]
      );

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        name: row.player_name,
        score: row.score,
        avatarImageUrl: row.avatar_image_url || null,
        submittedAt: row.created_at,
      }));

      res.json({
        date,
        leaderboard,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch leaderboard',
    });
  }
};

/**
 * Submit a score to the leaderboard
 * POST /api/leaderboard
 * Body: { name: string, score: number, avatarImageUrl?: string }
 */
export const submitScore = async (req, res) => {
  try {
    const { name, score, avatarImageUrl } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }

    if (typeof score !== 'number' || score < 1 || !Number.isInteger(score)) {
      return res.status(400).json({ error: 'Score must be a positive integer' });
    }

    const date = new Date().toISOString().split('T')[0];
    const playerName = name.trim();

    const client = await pool.connect();
    try {
      // Use ON CONFLICT to update if player already submitted today
      // Keep the better (lower) score
      const result = await client.query(
        `INSERT INTO leaderboard (player_name, score, date, avatar_image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (player_name, date)
         DO UPDATE SET
           score = LEAST(leaderboard.score, EXCLUDED.score),
           avatar_image_url = COALESCE(EXCLUDED.avatar_image_url, leaderboard.avatar_image_url),
           created_at = CASE
             WHEN EXCLUDED.score < leaderboard.score THEN EXCLUDED.created_at
             ELSE leaderboard.created_at
           END
         RETURNING player_name, score, date, avatar_image_url, created_at`,
        [playerName, score, date, avatarImageUrl || null]
      );

      res.json({
        success: true,
        result: {
          name: result.rows[0].player_name,
          score: result.rows[0].score,
          date: result.rows[0].date,
          avatarImageUrl: result.rows[0].avatar_image_url || null,
          submittedAt: result.rows[0].created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      error: error.message || 'Failed to submit score',
    });
  }
};

