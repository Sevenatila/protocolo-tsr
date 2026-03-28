import { MercadoPagoConfig, Payment } from 'mercadopago';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN?.trim(),
  options: { timeout: 5000 }
});

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
    const payment = new Payment(client);
    const { transaction_amount, token, installments, payment_method_id, payer, description } = req.body;

    if (!transaction_amount || !token) {
      return res.status(400).json({ error: 'Missing required fields: transaction_amount and token' });
    }

    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    const notificationUrl = productionHost
      ? `https://${productionHost}/api/webhooks`
      : undefined;

    const paymentData = {
      transaction_amount: Number(transaction_amount),
      token,
      installments: Number(installments) || 1,
      payment_method_id: payment_method_id || 'master',
      payer: {
        email: payer.email || 'cliente@email.com',
        identification: payer.identification || { type: 'CPF', number: '00000000000' }
      },
      description: description || 'Protocolo TSR',
      statement_descriptor: process.env.STATEMENT_DESCRIPTOR || 'PROTOCOLO TSR',
      ...(notificationUrl && { notification_url: notificationUrl }),
    };

    const result = await payment.create({ body: paymentData });

    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      installments: result.installments,
      payment_method_id: result.payment_method_id,
      date_created: result.date_created,
      date_approved: result.date_approved,
    });

  } catch (error) {
    if (error.cause?.length > 0) {
      const mpError = error.cause[0];
      return res.status(error.status || 400).json({
        error: mpError.description || mpError.message,
        code: mpError.code,
      });
    }
    return res.status(error.status || 500).json({
      error: error.message || 'Erro ao processar pagamento'
    });
  }
}
