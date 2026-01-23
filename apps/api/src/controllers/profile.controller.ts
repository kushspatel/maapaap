import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateProfileRequest, UpdateProfileRequest } from '@maapaap/shared';

export class ProfileController {
  // GET /api/v1/profiles
  static async getProfiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const result = await query(
        `SELECT p.*, COUNT(ms.id) as measurement_set_count
         FROM profiles p
         LEFT JOIN measurement_sets ms ON p.id = ms.profile_id
         WHERE p.user_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profiles',
      });
    }
  }

  // GET /api/v1/profiles/:id
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;

      const result = await query(
        `SELECT p.*, COUNT(ms.id) as measurement_set_count
         FROM profiles p
         LEFT JOIN measurement_sets ms ON p.id = ms.profile_id
         WHERE p.id = $1 AND p.user_id = $2
         GROUP BY p.id`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }

  // POST /api/v1/profiles
  static async createProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { name, nickname, age, height, notes }: CreateProfileRequest = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required',
        });
      }

      const result = await query(
        `INSERT INTO profiles (user_id, name, nickname, age, height, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, name, nickname, age, height, notes]
      );

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create profile',
      });
    }
  }

  // PUT /api/v1/profiles/:id
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;
      const { name, nickname, age, height, notes }: UpdateProfileRequest = req.body;

      // Check if profile exists and belongs to user
      const checkResult = await query(
        'SELECT * FROM profiles WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (nickname !== undefined) {
        updates.push(`nickname = $${paramCount++}`);
        values.push(nickname);
      }
      if (age !== undefined) {
        updates.push(`age = $${paramCount++}`);
        values.push(age);
      }
      if (height !== undefined) {
        updates.push(`height = $${paramCount++}`);
        values.push(height);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
      }

      values.push(id, req.user.id);

      const result = await query(
        `UPDATE profiles
         SET ${updates.join(', ')}
         WHERE id = $${paramCount++} AND user_id = $${paramCount++}
         RETURNING *`,
        values
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }
  }

  // DELETE /api/v1/profiles/:id
  static async deleteProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;

      const result = await query(
        'DELETE FROM profiles WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete profile',
      });
    }
  }

  // GET /api/v1/profiles/:id/measurement-sets
  static async getProfileMeasurementSets(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;

      // Verify profile belongs to user
      const profileCheck = await query(
        'SELECT id FROM profiles WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (profileCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
      }

      const result = await query(
        `SELECT ms.*, COUNT(me.id) as entry_count
         FROM measurement_sets ms
         LEFT JOIN measurement_entries me ON ms.id = me.measurement_set_id
         WHERE ms.profile_id = $1
         GROUP BY ms.id
         ORDER BY ms.created_at DESC`,
        [id]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get profile measurement sets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get measurement sets',
      });
    }
  }
}
