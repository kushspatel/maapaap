import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  // POST /api/v1/auth/send-otp
  static async sendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;

      if (!identifier || !type) {
        return res.status(400).json({
          success: false,
          error: 'Identifier and type are required',
        });
      }

      if (type !== 'email' && type !== 'phone') {
        return res.status(400).json({
          success: false,
          error: 'Type must be email or phone',
        });
      }

      await AuthService.sendOTP(identifier, 'login');

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          identifier,
          expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
        },
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP',
      });
    }
  }

  // POST /api/v1/auth/verify-otp
  static async verifyOTP(req: Request, res: Response) {
    try {
      const { identifier, otp, type } = req.body;

      if (!identifier || !otp || !type) {
        return res.status(400).json({
          success: false,
          error: 'Identifier, OTP, and type are required',
        });
      }

      const isValid = await AuthService.verifyOTP(identifier, otp, 'login');

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired OTP',
        });
      }

      // Create or get user
      const user = await AuthService.createOrGetUser(identifier, type);

      // Generate token
      const token = AuthService.generateToken(user.id, user.email, user.phone);

      // Create session
      await AuthService.createSession(user.id, token);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP',
      });
    }
  }

  // GET /api/v1/auth/me
  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const { query } = require('../config/database');
      const result = await query(
        'SELECT id, name, email, phone, created_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }

  // POST /api/v1/auth/logout
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(400).json({
          success: false,
          error: 'No token provided',
        });
      }

      const token = authHeader.substring(7);
      await AuthService.logout(req.user.id, token);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout',
      });
    }
  }
}
