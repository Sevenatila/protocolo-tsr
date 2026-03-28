const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { card_token, amount, installments, payer, description } = req.body;

  if (!card_token || !amount || !payer?.email) {
    return res.status(400).json({ error: 'Missing required fields: card_token, amount, payer.email' });
  }

  try {
    const amountInCents = Math.round(Number(amount) * 100);
    const secretKey = process.env.PAGARME_SECRET_KEY;
    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    const orderPayload = {
      items: [{
        amount: amountInCents,
        description: description || 'Protocolo TSR',
        quantity: 1,
        code: 'ITEM001'
      }],
      customer: {
        name: payer.name || 'Cliente',
        email: payer.email,
        type: 'individual',
        document: payer.cpf ? payer.cpf.replace(/\D/g, '') : '',
        document_type: 'CPF'
      },
      payments: [{
        payment_method: 'credit_card',
        credit_card: {
          installments: Number(installments) || 1,
          statement_descriptor: process.env.STATEMENT_DESCRIPTOR || 'PROTOCOLO TSR',
          card_token
        }
      }]
    };

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Erro ao processar pagamento',
        code: data.type
      });
    }

    const charge = data.charges?.[0];
    const lastTransaction = charge?.last_transaction;
    const approved = lastTransaction?.status === 'captured' || charge?.status === 'paid';

    return res.status(200).json({
      id: data.id,
      status: approved ? 'approved' : 'rejected',
      status_detail: lastTransaction?.acquirer_return_code || charge?.status,
      transaction_amount: amount,
      processor: 'pagarme'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno ao processar pagamento' });
  }
}
