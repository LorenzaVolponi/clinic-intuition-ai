import { describe, expect, it } from 'vitest';
import handler from './study-pack.js';

function createResponseCollector() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('api/study-pack handler', () => {
  it('retorna endpoint desativado para manter escopo clínico enxuto', async () => {
    const req = { method: 'POST', headers: {}, body: {} };
    const res = createResponseCollector();

    await handler(req, res);

    expect(res.statusCode).toBe(410);
    expect(res.body.error).toContain('desativado');
  });
});
