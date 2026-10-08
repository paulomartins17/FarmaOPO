import express, { Express } from 'express';
import cors from 'cors';
import { JsonMedicationRepository } from './repositories/medication.repository.js';
import { GeminiService } from './services/gemini.service.js';
import { MedicationService } from './services/medication.service.js';
import { MedicationController } from './controllers/medication.controller.js';
import { validateBody } from './middlewares/validation.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { createMedicationSchema, requestBriefingSchema } from './schemas/medication.schema.js';

export function createApp(): Express {
  const app = express();

  // Middlewares essenciais
  app.use(cors());
  app.use(express.json());

  // Injeção de dependências (Clean Architecture)
  const repository = new JsonMedicationRepository();
  const geminiService = new GeminiService();
  const medicationService = new MedicationService(repository, geminiService);
  const controller = new MedicationController(medicationService);

  // Healthcheck
  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'FarmaOPO API',
    });
  });

  // Rotas de Medicamentos
  app.get('/api/v1/medications', controller.list);
  app.post('/api/v1/medications', validateBody(createMedicationSchema), controller.create);
  app.get('/api/v1/medications/:id', controller.getById);
  app.delete('/api/v1/medications/:id', controller.delete);

  // Rotas de Inteligência Artificial / Gemini
  app.post('/api/v1/medications/briefing', validateBody(requestBriefingSchema), controller.generateBriefing);
  app.get('/api/v1/medications/:id/briefing', controller.getMedicationBriefing);

  // Middleware de erro centralizado
  app.use(errorHandler);

  return app;
}
