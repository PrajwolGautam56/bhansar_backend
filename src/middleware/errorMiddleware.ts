import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  }

  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate record' });
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return res.status(500).json({ message });
}
