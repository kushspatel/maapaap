import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { redisClient } from '../config/redis';
import { hashToken } from '../middleware/auth.middleware';

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export class AuthService {
  // Generate OTP
  static generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  // Send OTP via email/phone
  static async sendOTP(identifier: string, purpose: string = 'login'): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    await query(
      `INSERT INTO otps (identifier, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [identifier, otp, purpose, expiresAt]
    );

    // Store in Redis for quick lookup
    await redisClient.setEx(
      `otp:${identifier}:${purpose}`,
      OTP_EXPIRY_MINUTES * 60,
      otp
    );

    // TODO: Send email/SMS with OTP
    console.log(`📧 OTP for ${identifier}: ${otp} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);
  }

  // Verify OTP
  static async verifyOTP(identifier: string, otpCode: string, purpose: string = 'login'): Promise<boolean> {
    // Check Redis first
    const cachedOTP = await redisClient.get(`otp:${identifier}:${purpose}`);

    if (cachedOTP && cachedOTP === otpCode) {
      // Mark as used in database
      await query(
        `UPDATE otps
         SET used = true
         WHERE identifier = $1 AND otp_code = $2 AND purpose = $3 AND NOT used`,
        [identifier, otpCode, purpose]
      );

      // Delete from Redis
      await redisClient.del(`otp:${identifier}:${purpose}`);

      return true;
    }

    // Fallback to database
    const result = await query(
      `SELECT * FROM otps
       WHERE identifier = $1 AND otp_code = $2 AND purpose = $3
       AND expires_at > NOW() AND NOT used
       ORDER BY created_at DESC
       LIMIT 1`,
      [identifier, otpCode, purpose]
    );

    if (result.rows.length > 0) {
      // Mark as used
      await query(
        'UPDATE otps SET used = true WHERE id = $1',
        [result.rows[0].id]
      );
      return true;
    }

    return false;
  }

  // Create or get user by email/phone
  static async createOrGetUser(identifier: string, type: 'email' | 'phone') {
    const field = type === 'email' ? 'email' : 'phone';

    // Check if user exists
    let result = await query(
      `SELECT * FROM users WHERE ${field} = $1`,
      [identifier]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new user
    result = await query(
      `INSERT INTO users (${field}, ${type}_verified)
       VALUES ($1, true)
       RETURNING *`,
      [identifier]
    );

    return result.rows[0];
  }

  // Generate JWT token
  static generateToken(userId: string, email: string | null, phone: string | null): string {
    return jwt.sign(
      { userId, email, phone },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  // Create session
  static async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const tokenHash = hashToken(token);

    await query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  // Logout - invalidate session
  static async logout(userId: string, token: string): Promise<void> {
    const tokenHash = hashToken(token);

    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2',
      [userId, tokenHash]
    );
  }

  // Clean up expired OTPs and sessions
  static async cleanup(): Promise<void> {
    await query('DELETE FROM otps WHERE expires_at < NOW()');
    await query('DELETE FROM sessions WHERE expires_at < NOW()');
  }
}
