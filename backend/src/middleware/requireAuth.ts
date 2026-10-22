import type { RequestHandler } from 'express';
import { readUserId } from '../auth/token';
import { HttpError } from '../errors';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.get('authorization')?.split(' ') ?? [];
  const userId = scheme === 'Bearer' && token ? readUserId(token) : null;

  if (!userId) {
    throw new HttpError(401, 'You need to log in');
  }

  req.userId = userId;
  next();
};
