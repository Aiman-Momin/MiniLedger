import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (req) => {
  throw new HttpError(404, `Route ${req.method} ${req.path} not found`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({ error: { message: 'Validation failed', details } });
    return;
  }

  if (err instanceof MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Receipt must be 5MB or smaller' : err.message;
    res.status(status).json({ error: { message } });
    return;
  }

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong' } });
};
