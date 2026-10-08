import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FarmaOPO API] Servidor ativo e operando em http://localhost:${PORT}`);
  console.log(`[FarmaOPO API] Healthcheck: http://localhost:${PORT}/api/v1/health`);
});
