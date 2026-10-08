import { Request, Response, NextFunction } from 'express';
import { ConflictError, NotFoundError } from '../services/medication.service.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[GlobalErrorHandler]', err);

  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: err.message,
      },
    });
    return;
  }

  // Falhas não tratadas
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro interno no processamento da requisição.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
}
