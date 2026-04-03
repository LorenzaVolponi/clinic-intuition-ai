export default async function handler(_req, res) {
  return res.status(410).json({
    error: 'Endpoint desativado nesta versão.',
    message: 'O escopo atual mantém apenas anamnese e simulador clínico.',
  });
}
