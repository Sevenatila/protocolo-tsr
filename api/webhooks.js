import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
};

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN?.trim(),
  options: { timeout: 8000 },
});

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

async function notifyUtmify(payment) {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return;

  const amount = payment.transaction_amount || 29.90;
  const customerName = [payment.payer?.first_name, payment.payer?.last_name]
    .filter(Boolean).join(' ') || 'Cliente';

  const body = {
    isTest: false,
    status: 'approved',
    orderId: String(payment.id),
    customer: {
      name: customerName,
      email: payment.payer?.email || '',
      phone: payment.payer?.phone?.number || '',
      country: 'BR',
      document: payment.payer?.identification?.number || '',
    },
    platform: 'Protocolo TSR',
    products: [{
      id: 'protocolo-tsr',
      name: 'Protocolo TSR',
      planId: 'protocolo-tsr-av',
      planName: 'À Vista',
      quantity: 1,
      priceInCents: Math.round(amount * 100),
    }],
    paymentMethod: payment.payment_method_id || 'pix',
    createdAt: payment.date_created || new Date().toISOString(),
    approvedDate: payment.date_approved || new Date().toISOString(),
    commission: {
      totalPriceInCents: Math.round(amount * 100),
      gatewayFeeInCents: 0,
      userCommissionInCents: Math.round(amount * 100),
    },
  };

  const res = await fetch('https://api.utmify.com.br/api-credentials/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Utmify API error ${res.status}:`, text);
  } else {
    console.log('Utmify notificado com sucesso para o pedido:', payment.id);
  }
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
    if (!type || !data?.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Responde imediatamente ao Mercado Pago para evitar retentativas
    res.status(200).json({ received: true });

    if (type === 'payment') {
      try {
        const paymentApi = new Payment(mpClient);
        const payment = await paymentApi.get({ id: data.id });

        console.log(`Webhook payment ${payment.id}: status=${payment.status}`);

        if (payment.status === 'approved') {
          await notifyUtmify(payment);
        }
      } catch (err) {
        console.error('Erro ao processar pagamento no webhook:', err.message);
      }
    }

  } catch (error) {
    console.error('Erro no webhook handler:', error.message);
    return res.status(200).json({ received: true });
  }
}
