import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    phone: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET!;

    try {
      const decoded = jwt.verify(token, secret) as {
        userId: string;
        email: string;
        phone: string;
      };

      // Check if session exists and is valid
      const sessionResult = await query(
        'SELECT * FROM sessions WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
        [decoded.userId, hashToken(token)]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
        });
      }

      // Attach user to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
