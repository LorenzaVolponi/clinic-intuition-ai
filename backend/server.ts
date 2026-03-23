import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { clinicalRequestSchema, getHealthPayload, medbotRequestSchema, processClinicalAnalysis, processMedbot } from './service';

dotenv.config();

const app = express();
const port = Number(process.env.BACKEND_PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json(getHealthPayload());
});

app.post('/api/clinical-analysis', async (req, res) => {
  const parsed = clinicalRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  try {
    const result = await processClinicalAnalysis(parsed.data);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('clinical-analysis error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
});

app.post('/api/medbot', async (req, res) => {
  const parsed = medbotRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  try {
    const result = await processMedbot(parsed.data);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('medbot error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
});

app.listen(port, () => {
  console.log(`Backend MedInnova rodando em http://localhost:${port}`);
});
