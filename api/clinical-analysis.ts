import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clinicalRequestSchema, processClinicalAnalysis } from '../backend/service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = clinicalRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  try {
    const result = await processClinicalAnalysis(parsed.data);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
}
