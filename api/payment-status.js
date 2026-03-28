import { MercadoPagoConfig, Payment } from 'mercadopago';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = new Payment(client);
    const result = await payment.get({ id });

    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      date_approved: result.date_approved,
      payment_type_id: result.payment_type_id,
      payment_method_id: result.payment_method_id,
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
      error: error.message || 'Erro ao verificar status do pagamento'
    });
  }
}
