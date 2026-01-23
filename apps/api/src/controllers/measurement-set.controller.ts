import { Response } from 'express';
import { query, getClient } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  CreateMeasurementSetRequest,
  UpdateMeasurementSetRequest,
  GarmentType,
  Unit,
} from '@maapaap/shared';
import { getGarmentTemplate, getAllMeasurementKeys } from '@maapaap/shared';

export class MeasurementSetController {
  // GET /api/v1/measurement-sets/:id
  static async getMeasurementSet(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;

      const setResult = await query(
        `SELECT * FROM measurement_sets WHERE id = $1 AND user_id = $2`,
        [id, req.user.id]
      );

      if (setResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Measurement set not found',
        });
      }

      const measurementSet = setResult.rows[0];

      // Get measurements
      const entriesResult = await query(
        `SELECT * FROM measurement_entries WHERE measurement_set_id = $1 ORDER BY created_at ASC`,
        [id]
      );

      measurementSet.measurements = entriesResult.rows;

      res.json({
        success: true,
        data: measurementSet,
      });
    } catch (error) {
      console.error('Get measurement set error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get measurement set',
      });
    }
  }

  // POST /api/v1/measurement-sets
  static async createMeasurementSet(req: AuthRequest, res: Response) {
    const client = await getClient();

    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const {
        profile_id,
        garment_type,
        title,
        unit_default,
        fit_preference,
        notes,
        measurements,
      }: CreateMeasurementSetRequest = req.body;

      // Validate required fields
      if (!profile_id || !garment_type || !title || !unit_default || !fit_preference) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Verify profile belongs to user
      const profileCheck = await client.query(
        'SELECT id FROM profiles WHERE id = $1 AND user_id = $2',
        [profile_id, req.user.id]
      );

      if (profileCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
      }

      // Validate garment type
      const validGarmentTypes = Object.values(GarmentType);
      if (!validGarmentTypes.includes(garment_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid garment type',
        });
      }

      // Validate measurements against template
      const template = getGarmentTemplate(garment_type);
      const allowedKeys = getAllMeasurementKeys(garment_type);

      for (const measurement of measurements) {
        if (!allowedKeys.includes(measurement.key)) {
          return res.status(400).json({
            success: false,
            error: `Invalid measurement key: ${measurement.key}`,
          });
        }
      }

      await client.query('BEGIN');

      // Create measurement set
      const setResult = await client.query(
        `INSERT INTO measurement_sets
         (user_id, profile_id, garment_type, title, unit_default, fit_preference, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.id, profile_id, garment_type, title, unit_default, fit_preference, notes]
      );

      const measurementSet = setResult.rows[0];

      // Create measurement entries
      const entries = [];
      for (const measurement of measurements) {
        const definition = template.measurements.find((m) => m.key === measurement.key);

        if (!definition) continue;

        const entryResult = await client.query(
          `INSERT INTO measurement_entries
           (measurement_set_id, key, label_gu, label_en, value, unit, measure_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            measurementSet.id,
            measurement.key,
            definition.label_gu,
            definition.label_en,
            measurement.value,
            measurement.unit,
            definition.measure_type,
          ]
        );

        entries.push(entryResult.rows[0]);
      }

      await client.query('COMMIT');

      measurementSet.measurements = entries;

      res.status(201).json({
        success: true,
        message: 'Measurement set created successfully',
        data: measurementSet,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create measurement set error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create measurement set',
      });
    } finally {
      client.release();
    }
  }

  // PUT /api/v1/measurement-sets/:id
  static async updateMeasurementSet(req: AuthRequest, res: Response) {
    const client = await getClient();

    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;
      const {
        title,
        unit_default,
        fit_preference,
        notes,
        measurements,
      }: UpdateMeasurementSetRequest = req.body;

      // Check if measurement set exists and belongs to user
      const checkResult = await client.query(
        'SELECT * FROM measurement_sets WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Measurement set not found',
        });
      }

      const existingSet = checkResult.rows[0];

      await client.query('BEGIN');

      // Update measurement set
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (unit_default !== undefined) {
        updates.push(`unit_default = $${paramCount++}`);
        values.push(unit_default);
      }
      if (fit_preference !== undefined) {
        updates.push(`fit_preference = $${paramCount++}`);
        values.push(fit_preference);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (updates.length > 0) {
        values.push(id, req.user.id);

        await client.query(
          `UPDATE measurement_sets
           SET ${updates.join(', ')}
           WHERE id = $${paramCount++} AND user_id = $${paramCount++}`,
          values
        );
      }

      // Update measurements if provided
      if (measurements && measurements.length > 0) {
        const template = getGarmentTemplate(existingSet.garment_type);

        // Delete existing entries
        await client.query(
          'DELETE FROM measurement_entries WHERE measurement_set_id = $1',
          [id]
        );

        // Insert new entries
        for (const measurement of measurements) {
          const definition = template.measurements.find((m) => m.key === measurement.key);

          if (!definition) continue;

          await client.query(
            `INSERT INTO measurement_entries
             (measurement_set_id, key, label_gu, label_en, value, unit, measure_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              id,
              measurement.key,
              definition.label_gu,
              definition.label_en,
              measurement.value,
              measurement.unit,
              definition.measure_type,
            ]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch updated measurement set
      const updatedSet = await client.query(
        'SELECT * FROM measurement_sets WHERE id = $1',
        [id]
      );

      const entriesResult = await client.query(
        'SELECT * FROM measurement_entries WHERE measurement_set_id = $1',
        [id]
      );

      const result = updatedSet.rows[0];
      result.measurements = entriesResult.rows;

      res.json({
        success: true,
        message: 'Measurement set updated successfully',
        data: result,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update measurement set error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update measurement set',
      });
    } finally {
      client.release();
    }
  }

  // DELETE /api/v1/measurement-sets/:id
  static async deleteMeasurementSet(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { id } = req.params;

      const result = await query(
        'DELETE FROM measurement_sets WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Measurement set not found',
        });
      }

      res.json({
        success: true,
        message: 'Measurement set deleted successfully',
      });
    } catch (error) {
      console.error('Delete measurement set error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete measurement set',
      });
    }
  }
}
