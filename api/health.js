export default async function handler(_req, res) {
  return res.status(200).json({
    ok: true,
    providerConfigured: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
}
