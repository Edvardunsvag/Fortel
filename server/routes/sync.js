import { pool } from '../db/init.js';

/**
 * Fetch employees from Huma API using the provided access token
 */
const fetchEmployeesFromHuma = async (accessToken) => {
  const token = accessToken.replace(/^Bearer\s+/i, '').trim();
  
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const baseUrl = 'https://api.humahr.com';
  
  // Fetch paginated list of users
  const paginationParams = [
    { offset: 0, limit: 50 },
    { offset: 50, limit: 50 },
    { offset: 100, limit: 50 },
  ];

  const listDataPromises = paginationParams.map(async ({ offset, limit }) => {
    const apiUrl = `${baseUrl}/users?limit=${limit}&offset=${offset}&orderBy=name&orderDirection=asc`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Invalid access token.');
      }
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  });

  const listDataResults = await Promise.all(listDataPromises);
  const allItems = listDataResults.flatMap((result) => result.items);
  
  // Filter active users
  const activeUserIds = allItems
    .filter((user) => user.status?.active !== false)
    .map((user) => user.id);

  // Fetch detailed information for each user
  const userDetailPromises = activeUserIds.map(async (userId) => {
    const detailUrl = `${baseUrl}/users/${userId}`;

    try {
      const detailResponse = await fetch(detailUrl, {
        method: 'GET',
        headers,
      });

      if (!detailResponse.ok) {
        if (detailResponse.status === 401) {
          throw new Error('Authentication failed. Invalid access token.');
        }
        console.warn(`Failed to fetch details for user ${userId}: ${detailResponse.status}`);
        return null;
      }

      return await detailResponse.json();
    } catch (error) {
      console.warn(`Error fetching details for user ${userId}:`, error);
      return null;
    }
  });

  const userDetails = await Promise.all(userDetailPromises);
  return userDetails.filter((user) => user !== null);
};

/**
 * Map Huma API user detail to employee format
 */
const mapHumaUserToEmployee = (user) => {
  const getValue = (field) => field?.value;
  
  const givenName = getValue(user.givenName) || '';
  const familyName = getValue(user.familyName) || '';
  const preferredName = getValue(user.preferredName);
  const name = preferredName || `${givenName} ${familyName}`;
  
  const avatarImage = getValue(user.avatarImage);
  const avatarUrl = getValue(user.avatarUrl);
  const avatarImageUrl = avatarImage?.url || avatarUrl;
  
  const teams = getValue(user.teams) || [];
  const department = teams[0]?.name || '-';
  
  const locations = getValue(user.locations) || [];
  const office = locations[0]?.name || '-';
  
  // Extract teams directly from API - just get team names, no processing
  const teamsArray = teams ? teams.map((team) => team.name || team).filter(Boolean) : [];
  
  // Calculate age
  const birthDate = getValue(user.birthDate);
  let age = '-';
  if (birthDate) {
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      age = calculatedAge.toString();
    } catch {
      age = '-';
    }
  }
  
  // Supervisor
  const supervisorData = getValue(user.supervisor);
  let supervisor = '-';
  if (supervisorData) {
    supervisor = supervisorData.preferredName || `${supervisorData.givenName} ${supervisorData.familyName}`;
  }

  return {
    id: user.id,
    name,
    firstName: givenName,
    surname: familyName,
    avatarImageUrl,
    department,
    office,
    teams: teamsArray,
    age,
    supervisor,
  };
};

/**
 * Sync employees endpoint
 * POST /api/sync
 * Body: { accessToken: string }
 */
export const syncEmployees = async (req, res) => {
  try {
    let { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Handle token that might be pasted as JSON string (array format)
    if (typeof accessToken === 'string') {
      accessToken = accessToken.trim();
      // Try to parse if it looks like JSON
      if (accessToken.startsWith('[') || accessToken.startsWith('"')) {
        try {
          const parsed = JSON.parse(accessToken);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accessToken = typeof parsed[0] === 'string' ? parsed[0] : accessToken;
          } else if (typeof parsed === 'string') {
            accessToken = parsed;
          }
        } catch {
          // If parsing fails, use the original token
        }
      }
    }

    // Check if employees already exist in the database
    const checkClient = await pool.connect();
    let existingCount = 0;
    try {
      const existingEmployeesResult = await checkClient.query('SELECT COUNT(*) as count FROM employees');
      existingCount = parseInt(existingEmployeesResult.rows[0].count, 10);
    } catch (checkError) {
      // If table doesn't exist or error checking, continue with sync
      console.warn('Error checking existing employees, proceeding with sync:', checkError.message);
    } finally {
      checkClient.release();
    }
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Database is already synced',
        count: existingCount,
        alreadySynced: true,
      });
    }

    // Fetch employees from Huma API
    const userDetails = await fetchEmployeesFromHuma(accessToken);
    
    // Map to employee format
    const employees = userDetails.map(mapHumaUserToEmployee);

    // Store in PostgreSQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing employees
      await client.query('DELETE FROM employees');

      // Insert new employees
      for (const employee of employees) {
        await client.query(
          `INSERT INTO employees (
            id, name, first_name, surname, avatar_image_url,
            department, office, teams, age, supervisor, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            first_name = EXCLUDED.first_name,
            surname = EXCLUDED.surname,
            avatar_image_url = EXCLUDED.avatar_image_url,
            department = EXCLUDED.department,
            office = EXCLUDED.office,
            teams = EXCLUDED.teams,
            age = EXCLUDED.age,
            supervisor = EXCLUDED.supervisor,
            updated_at = CURRENT_TIMESTAMP`,
          [
            employee.id,
            employee.name,
            employee.firstName,
            employee.surname,
            employee.avatarImageUrl || null,
            employee.department,
            employee.office,
            employee.teams || [],
            employee.age,
            employee.supervisor || null,
          ]
        );
      }

      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Successfully synced ${employees.length} employees`,
        count: employees.length,
        alreadySynced: false,
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing employees:', error);
    res.status(500).json({
      error: error.message || 'Failed to sync employees',
    });
  }
};

