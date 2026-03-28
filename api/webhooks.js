import crypto from 'crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
};

function validateWebhookSignature(req) {
  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  if (!signature || !requestId) return false;

  const parts = signature.split(',');
  let ts, v1;
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }
  if (!ts || !v1) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - parseInt(ts) > 300) return false;

  const secret = process.env.MP_WEBHOOK_SECRET || '';
  const manifest = `id:${req.body.data?.id};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  return hmac.digest('hex') === v1;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (process.env.MP_WEBHOOK_SECRET) {
      if (!validateWebhookSignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    res.status(200).json({ received: true });

    console.log('Webhook recebido:', { type, id: data.id });
    // TODO: implementar lógica pós-pagamento (email de confirmação, liberar acesso, etc.)

  } catch (error) {
    return res.status(200).json({ received: true });
  }
}
