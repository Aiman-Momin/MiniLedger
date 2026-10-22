import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signToken(userId: string): string {
  return jwt.sign({}, config.jwtSecret, { subject: userId, expiresIn: '7d' });
}

export function readUserId(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return typeof payload === 'object' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
