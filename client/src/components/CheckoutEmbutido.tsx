import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface CheckoutEmbutidoProps {
  email: string;
  amount: number;
  description: string;
  onSuccess: (payment: unknown) => void;
  onPixGenerated?: (paymentId: string) => void;
  onPixPending?: (paymentId: string) => void;
}

const MP_PUBLIC_KEY = 'APP_USR-2481eb47-653e-468f-8ec9-535b8abaadd1';
const PAGARME_PUBLIC_KEY = 'pk_NP9lOpvigCaXzrme';
const RETRYABLE_CODES = ['cc_rejected_high_risk', 'cc_rejected_call_for_authorize', 'rejected'];

const GREEN = '#1e6b4a';
const LIGHT_GREEN = '#52c990';

export function CheckoutEmbutido({ email, amount, description, onSuccess, onPixGenerated, onPixPending }: CheckoutEmbutidoProps) {
  const [tab, setTab] = useState<'pix' | 'card'>('pix');
  const [pixState, setPixState] = useState<'idle' | 'loading' | 'generated' | 'pending'>('idle');
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_image: string; id: string } | null>(null);
  const [pixTimer, setPixTimer] = useState(600);
  const [copySuccess, setCopySuccess] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cpfError, setCpfError] = useState('');

  const mpRef = useRef<unknown>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ((window as any).MercadoPago && !mpRef.current) {
      mpRef.current = new (window as any).MercadoPago(MP_PUBLIC_KEY);
      return;
    }
    if (document.getElementById('mp-sdk')) return;
    const s = document.createElement('script');
    s.id = 'mp-sdk';
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.async = true;
    s.onload = () => {
      mpRef.current = new (window as any).MercadoPago(MP_PUBLIC_KEY);
    };
    document.body.appendChild(s);
  }, []);

  const clearIntervals = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => () => clearIntervals(), [clearIntervals]);

  useEffect(() => {
    if (pixState !== 'generated') return;
    timerRef.current = setInterval(() => {
      setPixTimer(t => {
        if (t <= 1) {
          clearIntervals();
          setPixState('idle');
          setPixData(null);
          return 600;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pixState, clearIntervals]);

  const generatePix = async () => {
    setPixState('loading');
    try {
      const res = await fetch('/api/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: amount,
          description,
          payer: {
            email,
            first_name: 'Cliente',
            last_name: 'PIX',
            identification: { type: 'CPF', number: '00000000000' }
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX');

      setPixData({
        qr_code: data.pix.qr_code,
        qr_code_image: data.pix.qr_code_image || data.pix.qr_code_base64,
        id: data.id
      });
      setPixTimer(600);
      setPixState('generated');
      onPixGenerated?.(data.id);

      let pendingTracked = false;
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/payment-status?id=${data.id}`);
          const s = await r.json();
          if (s.status === 'approved') {
            clearIntervals();
            onSuccess(s);
          } else if (s.status === 'in_process' || s.status === 'pending') {
            if (!pendingTracked) {
              pendingTracked = true;
              setPixState('pending');
              onPixPending?.(data.id);
            }
          } else if (s.status === 'rejected' || s.status === 'cancelled') {
            clearIntervals();
            setPixState('idle');
            setPixData(null);
          }
        } catch { /* silencioso */ }
      }, 5000);

    } catch (err: any) {
      setPixState('idle');
      alert(err.message || 'Erro ao gerar PIX. Tente novamente.');
    }
  };

  const copyCode = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').substring(0, 4);
    return d.length >= 3 ? d.substring(0, 2) + '/' + d.substring(2) : d;
  };

  const formatCpf = (v: string) =>
    v.replace(/\D/g, '').substring(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  const validateCpf = (cpf: string) => {
    const c = cpf.replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
    let d1 = 11 - (s % 11); if (d1 > 9) d1 = 0;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
    let d2 = 11 - (s % 11); if (d2 > 9) d2 = 0;
    return d1 === parseInt(c[9]) && d2 === parseInt(c[10]);
  };

  const tokenizeWithPagarme = async (cardData: { number: string; name: string; expiry: string; cvv: string }) => {
    const [month, year] = cardData.expiry.split('/');
    const res = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardData.number,
          holder_name: cardData.name,
          exp_month: parseInt(month),
          exp_year: parseInt('20' + year),
          cvv: cardData.cvv
        }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Erro ao tokenizar cartão');
    return data.id;
  };

  const processCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpfError('');
    setCardError('');

    if (!validateCpf(cardCpf)) {
      setCpfError('CPF inválido');
      return;
    }
    if (!mpRef.current) {
      setCardError('SDK ainda carregando. Aguarde um momento e tente novamente.');
      return;
    }

    setCardLoading(true);
    const number = cardNumber.replace(/\s/g, '');
    const [month, year] = cardExpiry.split('/');
    const cardData = { number, name: cardName, expiry: cardExpiry, cvv: cardCvv };
    const paymentMethodId = number.charAt(0) === '4' ? 'visa' : 'master';

    try {
      const mp = mpRef.current as any;
      const token = await mp.createCardToken({
        cardNumber: number,
        cardholderName: cardName,
        cardExpirationMonth: month || '',
        cardExpirationYear: year ? '20' + year : '',
        securityCode: cardCvv,
        identificationType: 'CPF',
        identificationNumber: cardCpf.replace(/\D/g, '')
      });

      const res = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.id,
          payment_method_id: paymentMethodId,
          transaction_amount: amount,
          installments: 1,
          payer: { email, identification: { type: 'CPF', number: cardCpf.replace(/\D/g, '') } },
          description
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'approved') {
        return onSuccess(data);
      }

      const detail = data.status_detail || '';
      const shouldRetry = RETRYABLE_CODES.some(code => detail.includes(code) || data.status === 'rejected');
      if (!shouldRetry) throw new Error(data.error || 'Pagamento não aprovado. Verifique os dados do cartão.');

      // Retry silencioso com Pagar.me
      const cardToken = await tokenizeWithPagarme(cardData);
      const pagarmeRes = await fetch('/api/process-payment-pagarme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_token: cardToken,
          amount,
          installments: 1,
          description,
          payer: { name: cardName, email, cpf: cardCpf }
        })
      });
      const pagarmeData = await pagarmeRes.json();
      if (pagarmeRes.ok && pagarmeData.status === 'approved') return onSuccess(pagarmeData);
      throw new Error(pagarmeData.error || 'Pagamento não aprovado. Verifique os dados e tente novamente.');

    } catch (err: any) {
      setCardError(err.message || 'Pagamento não aprovado. Verifique os dados e tente novamente.');
    } finally {
      setCardLoading(false);
    }
  };

  const timerMin = Math.floor(pixTimer / 60);
  const timerSec = String(pixTimer % 60).padStart(2, '0');
  const amountFormatted = `R$ ${amount.toFixed(2).replace('.', ',')}`;

  return (
    <motion.div
      id="checkout-embutido"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20
      }}
      className="p-5 mt-4"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5z" fill={LIGHT_GREEN} opacity="0.8" />
        </svg>
        <p className="text-white/50 text-xs">Pagamento 100% seguro e criptografado</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['pix', 'card'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t ? GREEN : 'transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
              border: `1px solid ${tab === t ? GREEN : 'rgba(255,255,255,0.12)'}`
            }}
          >
            {t === 'pix' ? '⚡ PIX' : '💳 Cartão'}
          </button>
        ))}
      </div>

      {/* PIX */}
      {tab === 'pix' && (
        <div>
          {pixState === 'idle' && (
            <>
              <p className="text-white/50 text-sm text-center mb-4">
                Pague instantaneamente via PIX e receba acesso imediato.
              </p>
              <button
                onClick={generatePix}
                className="w-full py-4 rounded-2xl text-white font-bold text-base"
                style={{ background: GREEN, boxShadow: `0 8px 24px ${GREEN}60` }}
              >
                Gerar QR Code PIX — {amountFormatted}
              </button>
            </>
          )}

          {pixState === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <p className="text-white/50 text-sm">Gerando PIX...</p>
            </div>
          )}

          {pixState === 'pending' && pixData && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${LIGHT_GREEN}20` }}>
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: LIGHT_GREEN, borderTopColor: 'transparent' }} />
              </div>
              <p className="text-white font-semibold text-base">PIX detectado!</p>
              <p className="text-white/50 text-sm text-center">Aguardando confirmação do banco...</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIGHT_GREEN }} />
                <p className="text-white/40 text-xs">Verificando a cada 5 segundos</p>
              </div>
            </div>
          )}

          {pixState === 'generated' && pixData && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-2xl">
                {pixData.qr_code_image
                  ? <img src={pixData.qr_code_image} alt="QR Code PIX" className="w-44 h-44" />
                  : <div className="w-44 h-44 flex items-center justify-center text-black text-xs text-center p-4">Use o código abaixo</div>
                }
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIGHT_GREEN }} />
                <p className="text-white/60 text-sm">
                  Expira em <span className="text-white font-bold">{timerMin}:{timerSec}</span>
                </p>
              </div>

              <div className="w-full">
                <p className="text-white/40 text-xs mb-2">Código Copia e Cola:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixData.qr_code}
                    className="flex-1 rounded-xl px-3 py-2 text-white/50 text-xs truncate"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={copyCode}
                    className="px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all shrink-0"
                    style={{ background: copySuccess ? '#10b981' : GREEN }}
                  >
                    {copySuccess ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <p className="text-white/30 text-xs text-center">
                Aguardando confirmação... verificando a cada 5 segundos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cartão */}
      {tab === 'card' && (
        <form onSubmit={processCard} className="space-y-3">
          <input
            placeholder="Número do cartão"
            value={cardNumber}
            onChange={e => setCardNumber(formatCard(e.target.value))}
            inputMode="numeric"
            required
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <input
            placeholder="Nome impresso no cartão"
            value={cardName}
            onChange={e => setCardName(e.target.value.toUpperCase())}
            required
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              placeholder="MM/AA"
              value={cardExpiry}
              onChange={e => setCardExpiry(formatExpiry(e.target.value))}
              inputMode="numeric"
              required
              className="rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none w-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}
            />
            <input
              placeholder="CVV"
              value={cardCvv}
              onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
              inputMode="numeric"
              required
              className="rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none w-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}
            />
          </div>
          <div>
            <input
              placeholder="CPF do titular"
              value={cardCpf}
              onChange={e => setCardCpf(formatCpf(e.target.value))}
              inputMode="numeric"
              required
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {cpfError && <p className="text-red-400 text-xs mt-1 px-1">{cpfError}</p>}
          </div>

          {cardError && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p className="text-red-400 text-sm">{cardError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={cardLoading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={{
              background: cardLoading ? 'rgba(255,255,255,0.08)' : GREEN,
              boxShadow: cardLoading ? 'none' : `0 8px 24px ${GREEN}60`
            }}
          >
            {cardLoading
              ? <><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Processando...</>
              : `Pagar ${amountFormatted}`
            }
          </button>

          <p className="text-white/30 text-xs text-center">
            Parcelamento disponível • Processado com segurança
          </p>
        </form>
      )}
    </motion.div>
  );
}
