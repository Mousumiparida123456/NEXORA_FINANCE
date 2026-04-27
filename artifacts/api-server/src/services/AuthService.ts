import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "nexora_access_premium_key_2025";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "nexora_refresh_premium_key_2025";

export class AuthService {
  /**
   * Scramble password into unreadable code
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare a plain password with its scrambled version
   */
  static async comparePassword(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }

  /**
   * Generate a pair of secure tokens
   */
  static generateTokens(payload: { userId: number; email: string }) {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    
    return { accessToken, refreshToken };
  }

  /**
   * Verify an access token
   */
  static verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET) as { userId: number; email: string };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify a refresh token
   */
  static verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number; email: string };
    } catch (error) {
      return null;
    }
  }
}
