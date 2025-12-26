import { pool } from '../db/init.js';

/**
 * Get employees endpoint
 * GET /api/employees
 * 
 */
export const getEmployees = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM employees ORDER BY name ASC'
      );

      // Map database rows to Employee format
      const employees = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        firstName: row.first_name,
        surname: row.surname,
        avatarImageUrl: row.avatar_image_url,
        department: row.department,
        office: row.office,
        teams: row.teams || [],
        age: row.age === '-' ? '-' : parseInt(row.age, 10) || '-',
        supervisor: row.supervisor || '-',
      }));

      res.json(employees);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch employees',
    });
  }
};

