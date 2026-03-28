import { MercadoPagoConfig, Payment } from 'mercadopago';
import QRCode from 'qrcode';

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
    const { transaction_amount, description, payer } = req.body;

    if (!transaction_amount) {
      return res.status(400).json({ error: 'Missing required field: transaction_amount' });
    }

    const notificationUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/webhooks`
      : undefined;

    const paymentData = {
      transaction_amount: Number(transaction_amount),
      payment_method_id: 'pix',
      description: description || 'Pagamento via PIX',
      statement_descriptor: process.env.STATEMENT_DESCRIPTOR || 'PROTOCOLO TSR',
      payer: {
        email: payer?.email || 'cliente@email.com',
        first_name: payer?.first_name || 'Cliente',
        last_name: payer?.last_name || 'PIX',
        identification: { type: 'CPF', number: '00000000000' }
      },
      ...(notificationUrl && { notification_url: notificationUrl }),
    };

    const result = await payment.create({ body: paymentData });

    let qrCodeDataUrl = null;
    if (result.point_of_interaction?.transaction_data?.qr_code) {
      qrCodeDataUrl = await QRCode.toDataURL(
        result.point_of_interaction.transaction_data.qr_code,
        { width: 256, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }
      );
    }

    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      pix: {
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        qr_code_image: qrCodeDataUrl,
        ticket_url: result.point_of_interaction?.transaction_data?.ticket_url
      }
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
      error: error.message || 'Erro ao criar pagamento PIX'
    });
  }
}
