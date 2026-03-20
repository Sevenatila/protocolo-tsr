import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Star, Check, ArrowRight, Sparkles, Clock, Shield, TrendingUp, Award, Users, Loader2, Camera, ScanFace } from "lucide-react";

type QuizAnswer = Record<string, string | string[]>;

interface QuizStep {
  id: string;
  section: string;
  type: "single" | "multi" | "grid" | "info" | "email" | "offer" | "age" | "skin-color" | "skin-problems" | "face-shape" | "statement" | "results" | "timeline" | "comparison" | "steps" | "features" | "testimonials" | "loading" | "splash" | "preloader" | "gender" | "selfie";
  question?: string;
  subtitle?: string;
  options?: Array<{ label: string; emoji?: string; icon?: string; image?: string; imageMale?: string }>;
  infoTitle?: string;
  infoSubtitle?: string;
  factText?: string;
  factDetail?: string;
  loadingTexts?: string[];
  loadingDuration?: number;
  statementImage?: string;
  statementImageMale?: string;
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: "welcome",
    section: "",
    type: "info",
    infoTitle: "Por que seu rosto parece 10 anos mais velho do que sua idade real — e como reverter isso em 21 dias",
    infoSubtitle: "O diagnóstico leva 2 minutos. O protocolo personalizado transforma em 21 dias.",
  },
  {
    id: "gender",
    section: "Perfil",
    type: "gender",
    question: "Você é?",
    options: [
      { label: "Mulher", image: "/images/mulher.webp" },
      { label: "Homem", image: "/images/homem.webp" },
    ],
  },
  {
    id: "age",
    section: "Perfil",
    type: "age",
    question: "Qual é a sua idade?",
    options: [
      { label: "18–25" },
      { label: "26–35" },
      { label: "36–45" },
      { label: "46–55" },
      { label: "55+" },
    ],
  },
  {
    id: "insecurity",
    section: "Perfil",
    type: "single",
    question: "Quando você se olha no espelho, qual desses pensamentos aparece?",
    options: [
      { label: "Pareço cansada(o) mesmo tendo dormido bem", emoji: "😩" },
      { label: "Meu rosto parece inchado e sem contorno", emoji: "😔" },
      { label: "Estou envelhecendo rápido demais", emoji: "😟" },
    ],
  },
  {
    id: "face-pain",
    section: "Perfil",
    type: "grid",
    question: "Qual dessas imagens mais te representa?",
    subtitle: "Selecione todas que se aplicam",
    options: [
      { label: "Rosto sem definição", image: "/images/nosso-quiz/feminino/full_face_fine_lines.webp", imageMale: "/images/nosso-quiz/masculino/rosto-inchado.webp" },
      { label: "Papada e inchaço", image: "/images/nosso-quiz/feminino/papada-sen-seta.webp", imageMale: "/images/nosso-quiz/masculino/papada.webp" },
      { label: "Olhar pesado e cansado", image: "/images/nosso-quiz/feminino/olheiras-setas-brancas.webp", imageMale: "/images/nosso-quiz/masculino/olheira.webp" },
      { label: "Flacidez facial", image: "/images/nosso-quiz/feminino/queixo-setas-vermelha.webp", imageMale: "/images/nosso-quiz/masculino/flacidez-facial.webp" },
    ],
  },
  {
    id: "social-impact",
    section: "Perfil",
    type: "single",
    question: "Você já evitou alguma dessas situações por causa da aparência?",
    options: [
      { label: "Tirar fotos ou selfies", emoji: "📸" },
      { label: "Encontros ou eventos sociais", emoji: "👥" },
      { label: "Chamadas de vídeo no trabalho", emoji: "💻" },
      { label: "Nenhuma dessas", emoji: "✨" },
    ],
  },
  {
    id: "statement-no-structure",
    section: "Análise",
    type: "info",
    infoTitle: "Isso não é só estética.",
    infoSubtitle: "Estudos mostram que <strong class='text-white'>rostos mais definidos são associados a mais confiança, presença e sucesso.</strong> Você está a poucos passos de descobrir o seu.",
  },
  {
    id: "face-goals",
    section: "Análise",
    type: "grid",
    question: "Qual área você mais quer transformar?",
    subtitle: "Selecione todas que se aplicam",
    options: [
      { label: "Mandíbula e queixo", image: "/images/nosso-quiz/feminino/queixo-setas-vermelha.webp", imageMale: "/images/nosso-quiz/masculino/mandibula-setas-brancas-man.webp" },
      { label: "Bochechas e maçãs", image: "/images/nosso-quiz/feminino/macas-do-rosto-seta-branca.webp", imageMale: "/images/nosso-quiz/masculino/macas-do-rosto-setas-brancas-man.webp" },
      { label: "Olhos e olhar", image: "/images/nosso-quiz/feminino/olhos-seta-branca.webp", imageMale: "/images/nosso-quiz/masculino/olhos-de-cacador.webp" },
      { label: "Rugas e sulcos", image: "/images/nosso-quiz/feminino/rugas-na-testa.webp", imageMale: "/images/nosso-quiz/masculino/bigode-chines-setas-brancas.webp" },
    ],
  },
  {
    id: "attention",
    section: "Análise",
    type: "single",
    question: "Como você se sente quando compara seu rosto com fotos de 2-3 anos atrás?",
    options: [
      { label: "Percebo que mudou muito", emoji: "😳" },
      { label: "Sinto que perdi definição", emoji: "😞" },
      { label: "Prefiro nem comparar", emoji: "🙈" },
    ],
  },
  {
    id: "statement-moldavel",
    section: "Transformação",
    type: "info",
    infoTitle: "Seu rosto é moldável.",
    infoSubtitle: "Assim como um atleta esculpe o corpo com treino, <strong class='text-white'>você pode esculpir seu rosto</strong> com os exercícios certos. <strong class='text-white'>Sem cirurgia. Sem botox.</strong>",
    statementImage: "/images/nosso-quiz/feminino/seu-rosto-e-moldavel.webp",
    statementImageMale: "/images/nosso-quiz/masculino/seu-rosto-e-moldavel.webp",
  },
  {
    id: "commitment",
    section: "Transformação",
    type: "single",
    question: "Você está disposto(a) a dedicar alguns minutos por dia para transformar seu rosto?",
    options: [
      { label: "Com certeza, quero começar agora", emoji: "🔥" },
      { label: "Sim, se for simples e rápido", emoji: "⚡" },
      { label: "Tenho dúvidas se funciona", emoji: "🤔" },
    ],
  },
  {
    id: "dedication-time",
    section: "Transformação",
    type: "single",
    question: "Quanto tempo você consegue dedicar por dia?",
    options: [
      { label: "5 minutos", emoji: "⚡" },
      { label: "10 minutos", emoji: "🎯" },
      { label: "15 minutos", emoji: "🏋️" },
    ],
  },
  {
    id: "testimonials",
    section: "Transformação",
    type: "testimonials",
    infoTitle: "Quem já transformou o rosto com TSR",
  },
  {
    id: "selfie",
    section: "Resultados",
    type: "selfie",
    question: "Tire uma selfie para gerar seu diagnóstico facial",
    subtitle: "Sua foto será analisada para criar um protocolo 100% personalizado para o seu rosto.",
  },
  {
    id: "personalization",
    section: "Resultados",
    type: "info",
    infoTitle: "Seu mapa facial foi gerado",
    infoSubtitle: "Identificamos as áreas com maior potencial de transformação no seu rosto.",
  },
  { id: "offer", section: "", type: "offer" },
];

// Mimika-style color palette
const DARK_BG = "#111111";
const HEADER_BG = "#0d2219";
const BTN_GREEN = "#1e6b4a";
const ACCENT_GREEN = "#2d9464";
const LIGHT_GREEN = "#52c990";
const AMBER = "#f5b800";
const CARD_BG = "rgba(255,255,255,0.05)";
const CARD_BORDER = "rgba(255,255,255,0.1)";

// Segment boundaries for 4-part progress bar
// Steps: 0 welcome, 1 gender, 2 age, 3 insecurity, 4 face-pain, 5 social-impact,
// 6 statement-no-structure, 7 face-goals, 8 attention, 9 statement-moldavel,
// 10 commitment, 11 dedication-time, 12 testimonials, 13 selfie,
// 14 personalization, 15 offer
const SEGMENTS = [
  { start: 1, end: 5, label: "Perfil" },
  { start: 6, end: 8, label: "Análise" },
  { start: 9, end: 12, label: "Transformação" },
  { start: 13, end: 14, label: "Resultados" },
];

function getSegmentProgress(currentStep: number): { activeSegment: number; segmentFill: number } {
  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    if (currentStep <= seg.end) {
      const fill = (currentStep - seg.start) / (seg.end - seg.start + 1);
      return { activeSegment: i + 1, segmentFill: Math.max(0, Math.min(1, fill)) };
    }
  }
  return { activeSegment: 6, segmentFill: 1 };
}

function PulsingRing({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{ borderColor: `${LIGHT_GREEN}50` }}
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [resultsSlide, setResultsSlide] = useState(0);
  const [bonusSlide, setBonusSlide] = useState(0);
  const [countdown, setCountdown] = useState({ minutes: 14, seconds: 59 });
  useEffect(() => {
    if (QUIZ_STEPS[currentStep]?.type !== 'offer') return;
    const len = answers['gender'] === 'Homem' ? 3 : 5;
    const timer = setInterval(() => {
      setResultsSlide(s => (s + 1) % len);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentStep]);
  useEffect(() => {
    if (QUIZ_STEPS[currentStep]?.type !== 'offer') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) return prev;
        if (prev.seconds === 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieAnalyzing, setSelfieAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = QUIZ_STEPS[currentStep];

  useEffect(() => {
    const prev = answers[step.id];
    if (Array.isArray(prev)) {
      setSelectedOptions(prev);
    } else {
      setSelectedOptions([]);
    }
    setSelfiePreview(null);
    setSelfieAnalyzing(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    if (step.type === "multi" || step.type === "grid" || step.type === "skin-problems") {
      setAnswers((prev) => ({ ...prev, [step.id]: selectedOptions }));
    }
    setDirection(1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, QUIZ_STEPS.length - 1));
      setIsAnimating(false);
    }, 300);
  }, [currentStep, selectedOptions, step, isAnimating]);

  const goBack = useCallback(() => {
    if (currentStep === 0 || isAnimating) return;
    setDirection(-1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
      setIsAnimating(false);
    }, 300);
  }, [currentStep, isAnimating]);

  const selectSingle = useCallback(
    (option: string) => {
      if (isAnimating) return;
      setAnswers((prev) => ({ ...prev, [step.id]: option }));
      setDirection(1);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, QUIZ_STEPS.length - 1));
        setIsAnimating(false);
      }, 500);
    },
    [step, isAnimating]
  );

  const toggleMulti = useCallback((option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const renderHeader = () => {
    if (step.type === "info" && step.id === "welcome") return null;
    if (step.type === "loading") return null;
    if (step.type === "splash" || step.type === "preloader") return null;
    if (step.type === "offer") return null;

    const { activeSegment, segmentFill } = getSegmentProgress(currentStep);

    return (
      <div
        data-testid="quiz-header"
        className="sticky top-0 z-50 px-4 pt-3 pb-3"
        style={{ background: HEADER_BG }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center w-8">
            {currentStep > 0 && (
              <button
                data-testid="button-back"
                onClick={goBack}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}
          </div>
          <span className="text-white/70 text-sm font-semibold">{step.section || "Progresso"}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/50 text-xs font-medium tracking-wide whitespace-nowrap">#1 em Definição Facial</span>
            <Star className="w-3.5 h-3.5 fill-current" style={{ color: AMBER }} />
            <span className="font-bold text-sm" style={{ color: AMBER }}>4.8</span>
          </div>
        </div>
        {/* 6-segment progress bar */}
        <div className="flex gap-1">
          {SEGMENTS.map((_, i) => {
            const segIdx = i + 1;
            const filled = segIdx < activeSegment ? 1 : segIdx === activeSegment ? segmentFill : 0;
            return (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: LIGHT_GREEN }}
                  animate={{ width: `${filled * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center min-h-screen"
    >
      {/* Hero image */}
      <div className="relative w-full">
        <div className="w-full overflow-hidden" style={{ maxHeight: "55vh" }}>
          <img
            src="/images/mimika/welcome-loader-photos-2.webp"
            alt="Rostos felizes"
            width={750}
            height={820}
            className="w-full object-cover object-top"
            style={{ maxHeight: "55vh" }}
          />
        </div>
        {/* Gradient overlay at bottom of image */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: `linear-gradient(to bottom, transparent, ${DARK_BG})` }}
        />
        {/* Top badge */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5"
            style={{ background: HEADER_BG, border: `1px solid ${LIGHT_GREEN}40` }}
          >
            <Star className="w-3.5 h-3.5 fill-current" style={{ color: AMBER }} />
            <span className="text-xs font-bold tracking-wide" style={{ color: AMBER }}>#1 em Definição Facial</span>
            <span className="font-bold text-xs text-white/80">4.8</span>
          </div>
        </div>
      </div>

      <div className="w-full px-6 pb-8 pt-2 flex flex-col items-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold text-white text-center mb-3 leading-tight"
          data-testid="text-welcome-title"
        >
          Seu rosto pode parecer{" "}
          <span style={{ color: LIGHT_GREEN }}>10 anos mais jovem</span>
          {" "}em apenas 21 dias
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-white/55 text-base text-center mb-6 max-w-sm"
        >
          O diagnóstico leva 2 minutos. O protocolo personalizado transforma em 21 dias.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs"
        >
          {[
            { icon: <Users className="w-5 h-5" />, label: "2M+ pessoas" },
            { icon: <Star className="w-5 h-5" />, label: "4.8 estrelas" },
            { icon: <Award className="w-5 h-5" />, label: "Método #1" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <div style={{ color: LIGHT_GREEN }}>{item.icon}</div>
              <span className="text-white/70 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="w-full"
        >
          <button
            data-testid="button-start-quiz"
            onClick={goNext}
            className="w-full h-14 text-lg font-bold rounded-2xl text-white transition-all active:scale-95"
            style={{ background: BTN_GREEN }}
          >
            Fazer meu diagnóstico grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <p className="text-white/50 text-xs text-center mt-3">Leva apenas 2 minutos • 100% gratuito</p>
        </motion.div>
      </div>
    </motion.div>
  );

  useEffect(() => {
    if (step.type === "loading") {
      const duration = step.loadingDuration || 3000;
      const timer = setTimeout(() => {
        goNext();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep, step.type, step.loadingDuration]);


  const renderGenderQuestion = () => (
    <div className="px-5 pt-8 pb-6">
      <h2 data-testid="text-question" className="text-2xl font-bold text-white text-center mb-8 leading-tight">{step.question}</h2>
      <div className="flex gap-4 justify-center">
        {step.options?.map((opt, i) => (
          <motion.button
            key={opt.label}
            data-testid={`option-${step.id}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => selectSingle(opt.label)}
            className="flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${LIGHT_GREEN}50`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5">
              <img src={opt.image} alt={opt.label} className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-white text-base font-medium">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderSingleQuestion = () => (
    <div className="px-5 pt-8 pb-6">
      <h2 data-testid="text-question" className="text-2xl font-bold text-white text-center mb-8 leading-tight">{step.question}</h2>
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <motion.button
            key={opt.label}
            data-testid={`option-${step.id}-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => selectSingle(opt.label)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 text-left group"
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${LIGHT_GREEN}50`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
            <span className="text-white text-base font-medium">{opt.label}</span>
          </motion.button>
        ))}
      </div>
      {step.factText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl"
          style={{ background: `${BTN_GREEN}20`, border: `1px solid ${LIGHT_GREEN}30` }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: LIGHT_GREEN }}>{step.factText}</p>
              <p className="text-white/60 text-sm">{step.factDetail}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );


  const renderGridQuestion = () => {
    const hasImages = step.options?.some(opt => opt.image);
    return (
      <div className="px-5 pt-8 pb-6">
        <h2 data-testid="text-question" className="text-2xl font-bold text-white text-center mb-2 leading-tight">{step.question}</h2>
        {step.subtitle && <p className="text-white/40 text-sm text-center mb-6">{step.subtitle}</p>}
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {step.options?.map((opt, i) => {
            const isSelected = selectedOptions.includes(opt.label);
            return (
              <motion.button
                key={opt.label}
                data-testid={`option-${step.id}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => toggleMulti(opt.label)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-200 overflow-hidden ${
                  hasImages ? "p-2" : "p-5 min-h-[120px]"
                }`}
                style={{
                  borderColor: isSelected ? `${LIGHT_GREEN}70` : 'rgba(255,255,255,0.1)',
                  background: isSelected ? `${BTN_GREEN}20` : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? `0 4px 16px ${BTN_GREEN}25` : 'none',
                }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-lg"
                    style={{ background: BTN_GREEN }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
                {opt.image ? (
                  <div className="w-full rounded-xl overflow-hidden mb-2 bg-white" style={{ height: '120px' }}>
                    <img
                      src={(opt.imageMale && answers['gender'] === 'Homem') ? opt.imageMale : opt.image}
                      alt={opt.label}
                      className="w-full h-full object-cover object-bottom"
                      loading="lazy"
                    />
                  </div>
                ) : opt.emoji ? (
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                    <span className="text-xl">{opt.emoji}</span>
                  </div>
                ) : null}
                <span className="text-sm font-medium text-center leading-tight" style={{ color: isSelected ? LIGHT_GREEN : 'rgba(255,255,255,0.8)' }}>
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <button
          data-testid="button-next"
          onClick={goNext}
          disabled={selectedOptions.length === 0}
          className="w-full h-14 text-lg font-semibold rounded-2xl disabled:opacity-40 text-white"
          style={{ background: selectedOptions.length > 0 ? BTN_GREEN : undefined }}
        >
          Próximo
        </button>
      </div>
    );
  };

  const renderAge = () => (
    <div className="px-5 pt-8 pb-6">
      <h2 data-testid="text-question" className="text-2xl font-bold text-white text-center mb-8 leading-tight">{step.question}</h2>
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <motion.button
            key={opt.label}
            data-testid={`option-${step.id}-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => selectSingle(opt.label)}
            className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center"
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${LIGHT_GREEN}50`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            <span className="text-white text-lg font-semibold">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderInfoScreen = () => {
    if (step.id === "welcome") return renderWelcome();

    const isPersonalization = step.id === "personalization";
    const isAlmostReady = step.id === "almost-ready";
    const isSkinTypeIntro = step.id === "skin-type-intro";
    const isRiskComparison = step.id === "risk-comparison";
    const isStatementNoStructure = step.id === "statement-no-structure";
    const isStatementMoldavel = step.id === "statement-moldavel";

    return (
      <div className="px-5 pt-12 pb-6 flex flex-col items-center min-h-[70vh]">
        {isPersonalization && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mb-6 relative flex justify-center"
          >
            <div className="relative w-64">
              <img
                src={answers['gender'] === 'Homem'
                  ? "/images/nosso-quiz/masculino/seu-mapa-facial-foi-gerado.webp"
                  : "/images/nosso-quiz/feminino/seu-mapa-facial-foi-gerado.webp"}
                alt="Zonas faciais"
                className="w-full object-contain"
              />
              {/* Zonas coloridas — paths extraídos do Mimika, viewBox original 984×984 */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 984 984" fill="none">
                {/* FrontalArea — roxo */}
                <motion.path
                  d="M491.713 421.569s49.724-98.04 49.724-163.399c0-16.34-99.448-16.34-99.448 0 0 65.359 49.724 163.399 49.724 163.399Z"
                  fill="#A512FF" fillOpacity="0.55"
                  opacity="0" animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 0.4, delay: 0.3, times: [0, 0.5, 1] }} />
                {/* BrowArch direito (lado esquerdo da tela) — verde */}
                <motion.path
                  d="M458.564 372.549l-33.149-98.039-99.447 16.34s0 32.679 16.574 49.019c16.575 16.34 116.022 32.68 116.022 32.68Z"
                  fill="#0DEE67" fillOpacity="0.55"
                  opacity="0" animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 0.4, delay: 0.55, times: [0, 0.5, 1] }} />
                {/* BrowArch esquerdo (lado direito da tela) — verde */}
                <motion.path
                  d="M524.862 372.549l33.149-98.039 99.447 16.34s0 32.679-16.574 49.019c-16.575 16.34-116.022 32.68-116.022 32.68Z"
                  fill="#0DEE67" fillOpacity="0.55"
                  opacity="0" animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 0.4, delay: 0.75, times: [0, 0.5, 1] }} />
                {/* CheekboneCheekArea esquerdo — teal */}
                <motion.path
                  d="M270.718 492.375c11.05-5.447 127.072 27.233 149.171 76.252 7.096 15.741-46.961 38.127-49.723 81.7-2.763 43.573 16.574 70.806 16.574 70.806s-70.442-76.253-93.922-125.272c-23.481-49.02-33.15-98.04-22.1-103.486Z"
                  fill="#05B6EE" fillOpacity="0.5"
                  opacity="0" animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 0.4, delay: 1.0, times: [0, 0.5, 1] }} />
                {/* CheekboneCheekArea direito — teal */}
                <motion.path
                  d="M713.508 492.375c-11.05-5.447-127.072 27.233-149.171 76.252-7.094 15.741 46.961 38.127 49.724 81.7 2.762 43.573-16.575 70.806-16.575 70.806s70.442-76.253 93.923-125.272c23.48-49.02 33.149-98.04 22.099-103.486Z"
                  fill="#05B6EE" fillOpacity="0.5"
                  opacity="0" animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 0.4, delay: 1.2, times: [0, 0.5, 1] }} />
              </svg>
            </div>
          </motion.div>
        )}
        {isAlmostReady && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative w-28 h-28 rounded-full flex items-center justify-center mb-8"
            style={{ background: `${BTN_GREEN}40`, border: `2px solid ${LIGHT_GREEN}60` }}
          >
            {/* Leaf / nature decoration */}
            <svg viewBox="0 0 60 60" className="w-14 h-14">
              <path d="M 30 50 Q 10 35 15 15 Q 30 5 45 15 Q 50 35 30 50 Z" fill={LIGHT_GREEN} opacity="0.8" />
              <line x1="30" y1="50" x2="30" y2="20" stroke={DARK_BG} strokeWidth="1.5" />
              <path d="M 30 35 Q 38 30 42 22" fill="none" stroke={DARK_BG} strokeWidth="1" />
              <path d="M 30 28 Q 22 23 20 16" fill="none" stroke={DARK_BG} strokeWidth="1" />
            </svg>
            <PulsingRing delay={0} />
          </motion.div>
        )}
        {isSkinTypeIntro && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mb-8 w-full"
          >
            {/* Arc / circular decoration with dark green */}
            <div className="flex justify-center mb-4">
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: HEADER_BG, border: `3px solid ${LIGHT_GREEN}50` }}
              >
                <svg viewBox="0 0 80 80" className="w-16 h-16">
                  <path d="M 40 70 Q 15 55 15 35 A 25 25 0 0 1 65 35 Q 65 55 40 70 Z" fill={BTN_GREEN} opacity="0.7" />
                  <circle cx="40" cy="32" r="12" fill="none" stroke={LIGHT_GREEN} strokeWidth="2" strokeDasharray="3 2" />
                  <circle cx="33" cy="30" r="2" fill={LIGHT_GREEN} />
                  <circle cx="47" cy="30" r="2" fill={LIGHT_GREEN} />
                  <path d="M 35 40 Q 40 45 45 40" fill="none" stroke={LIGHT_GREEN} strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
        {isRiskComparison && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full mb-8"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="p-3 text-white/40 text-xs font-medium"></div>
                <div className="p-3 text-center text-white/50 text-xs font-medium">Sem o Guia</div>
                <div className="p-3 text-center text-xs font-bold rounded-t-xl" style={{ background: `${BTN_GREEN}20`, color: LIGHT_GREEN }}>Com Nosso Guia</div>
              </div>
              {[
                { label: "Cobertura de rugas", without: "Alto", with: "Baixo" },
                { label: "Pele fina", without: "Médio", with: "Baixo" },
                { label: "Deformação do contorno facial", without: "Alto", with: "Baixo" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-0 border-t border-white/5">
                  <div className="p-3 text-white/60 text-xs">{row.label}</div>
                  <div className="p-3 text-center text-red-400 text-xs font-medium flex items-center justify-center gap-1">
                    <span className="text-red-400">▲</span> {row.without}
                  </div>
                  <div className="p-3 text-center text-xs font-medium flex items-center justify-center gap-1" style={{ background: `${BTN_GREEN}10`, color: LIGHT_GREEN }}>
                    <span>▼</span> {row.with}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs text-center mt-2">Com base em dados do usuário</p>
          </motion.div>
        )}
        {isStatementNoStructure && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-2xl overflow-hidden mb-6 border border-white/10"
          >
            <img
              src={answers['gender'] === 'Homem'
                ? "/images/nosso-quiz/masculino/isso-nao-e-so-estetica.webp"
                : "/images/nosso-quiz/feminino/isso-nao-e-so-estetica.webp"}
              alt="Antes e depois"
              className="w-full h-auto object-contain"
            />
          </motion.div>
        )}
        {isStatementMoldavel && (step.statementImage || step.statementImageMale) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-2xl overflow-hidden mb-6 border border-white/10"
          >
            <img
              src={(step.statementImageMale && answers['gender'] === 'Homem') ? step.statementImageMale : step.statementImage}
              alt="Rosto moldável"
              className="w-full h-auto object-contain"
            />
          </motion.div>
        )}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-white text-center mb-4 leading-tight"
          data-testid="text-info-title"
        >
          {step.infoTitle}
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/50 text-base text-center mb-8 max-w-sm"
          dangerouslySetInnerHTML={{ __html: step.infoSubtitle || '' }}
        />
        {step.factText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 mb-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: LIGHT_GREEN }} />
              <p className="font-bold text-lg" style={{ color: LIGHT_GREEN }}>{step.factText}</p>
            </div>
            <p className="text-white/50 text-sm">{step.factDetail}</p>
          </motion.div>
        )}
        {isRiskComparison && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full p-4 rounded-2xl mb-8 flex gap-4 items-center"
            style={{ background: `${BTN_GREEN}15`, border: `1px solid ${LIGHT_GREEN}25` }}
          >
            <div className="flex-1">
              <p className="font-bold text-lg mb-1" style={{ color: LIGHT_GREEN }}>92% dos nossos usuários</p>
              <p className="text-white/60 text-sm">dizem que começam a parecer e a sentir-se mais jovens</p>
            </div>
          </motion.div>
        )}
        {isPersonalization && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full space-y-3 mb-8"
          >
            {[
              { label: "Exercícios de Face Yoga", pct: 87 },
              { label: "Ioga Facial", pct: 73 },
              { label: "Aptidão Facial", pct: 64 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-white/70 text-sm">{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: LIGHT_GREEN }}>{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: BTN_GREEN }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ delay: 0.4 + i * 0.15, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
        <div className="mt-auto w-full">
          <button
            data-testid="button-next"
            onClick={goNext}
            className="w-full h-14 text-lg font-semibold rounded-2xl text-white"
            style={{ background: BTN_GREEN }}
          >
            {isPersonalization ? "Ver meu protocolo" : isStatementNoStructure || isStatementMoldavel ? "Entendi, continuar" : isSkinTypeIntro ? "Vamos!" : "Continuar"}
          </button>
        </div>
      </div>
    );
  };


  const renderTestimonials = () => {
    const isMale = answers['gender'] === 'Homem';
    const quizTestimonials = isMale
      ? [
          { name: "Carlos M.", age: "38 anos", stars: 5, img: "/images/wise/13V5l-argumentos-1.webp", text: "Em 3 semanas meu maxilar ficou visivelmente mais definido. Minha esposa notou antes de mim! O protocolo é simples e encaixa na rotina sem esforço." },
          { name: "Rafael S.", age: "34 anos", stars: 5, img: "/images/wise/IiF7f-argumentos-2.webp", text: "Sempre tive papada e achei que era genética. Depois de 4 semanas seguindo o protocolo, a diferença é real. Rosto muito mais definido e aparência mais jovem." },
          { name: "Lucas T.", age: "41 anos", stars: 5, img: "/images/wise/Ap7i9-argumentos-3.webp", text: "Cara, em 10 dias já dava pra notar diferença. Agora com 21 dias, meu maxilar tá definido de verdade. Recomendo muito!" },
        ]
      : [
          { name: "Ana C.", age: "42 anos", stars: 5, img: "/images/nosso-quiz/feminino/dep1.webp", text: "Todos os meus amigos dizem que fiquei mais jovem. Com os exercícios do TSR consegui tonificar os músculos faciais e ter contornos muito mais nítidos. Recomendo para todo mundo! 😍" },
          { name: "Mariana S.", age: "27 anos", stars: 5, img: "/images/nosso-quiz/feminino/dep2.webp", text: "Logo na primeira semana já notei redução do inchaço. Continuei seguindo o protocolo e agora tenho o rosto que sempre quis." },
          { name: "Juliana T.", age: "38 anos", stars: 5, img: "/images/nosso-quiz/feminino/dep3.webp", text: "Sempre tive um rosto mais redondo e isso me incomodava. Em 10 dias já dava para notar diferença. Com 21 dias, meu contorno está definido de verdade!" },
        ] as Array<{ name: string; age: string; stars: number; img?: string; text: string }>;

    return (
      <div className="px-5 pt-8 pb-6">
        <h2 data-testid="text-info-title" className="text-2xl font-bold text-white text-center mb-6 leading-tight">
          Quem já <span style={{ color: LIGHT_GREEN }}>transformou o rosto</span> com TSR
        </h2>
        {/* Before/After results image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full rounded-2xl overflow-hidden mb-6 border border-white/10"
        >
          <img
            src={isMale
              ? "/images/nosso-quiz/masculino/depoimentos.webp"
              : "/images/nosso-quiz/feminino/depoimentos7.webp"}
            alt="Resultados alcançados"
            className="w-full h-auto object-contain"
          />
        </motion.div>
        <div className="space-y-4 mb-8">
          {quizTestimonials.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                {review.img ? (
                  <img src={review.img} alt={review.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: BTN_GREEN, color: LIGHT_GREEN }}
                  >
                    {review.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm" style={{ color: LIGHT_GREEN }}>{review.name}</p>
                  <p className="text-white/40 text-xs">{review.age}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array(review.stars).fill(0).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: AMBER }} />
                ))}
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{review.text}</p>
            </motion.div>
          ))}
        </div>
        <button
          data-testid="button-next"
          onClick={goNext}
          className="w-full h-14 text-lg font-semibold rounded-2xl text-white"
          style={{ background: BTN_GREEN }}
        >
          Próximo
        </button>
      </div>
    );
  };

  const selfieLoadingTexts = [
    "Detectando estrutura facial...",
    "Mapeando pontos de definição...",
    "Analisando simetria...",
    "Cruzando dados com seu biotipo...",
    "Gerando seu protocolo personalizado...",
  ];

  const skipLoadingTexts = [
    "Analisando seu perfil facial...",
    "Mapeando áreas de transformação...",
    "Cruzando dados com seu biotipo...",
    "Gerando seu protocolo personalizado...",
  ];

  const handleSelfieCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelfiePreview(ev.target?.result as string);
      setSelfieAnalyzing(true);
      setTimeout(() => {
        setSelfieAnalyzing(false);
        goNext();
      }, 6000);
    };
    reader.readAsDataURL(file);
  }, [goNext]);

  const handleSkipSelfie = useCallback(() => {
    setSelfiePreview(null);
    setSelfieAnalyzing(true);
    setTimeout(() => {
      setSelfieAnalyzing(false);
      goNext();
    }, 5000);
  }, [goNext]);

  const renderSelfie = () => (
    <div className="px-5 pt-8 pb-6 flex flex-col items-center min-h-[80vh] justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleSelfieCapture}
      />

      {!selfieAnalyzing && !selfiePreview && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-8"
          >
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{ background: `${BTN_GREEN}30`, border: `2px solid ${LIGHT_GREEN}40` }}
            >
              <ScanFace className="w-16 h-16" style={{ color: LIGHT_GREEN }} />
            </div>
            <PulsingRing delay={0} />
            <PulsingRing delay={0.8} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-white text-center mb-3 leading-tight"
          >
            {step.question}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm text-center mb-8 max-w-xs leading-relaxed"
          >
            {step.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-xs space-y-3"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-14 text-lg font-bold rounded-2xl text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
            >
              <Camera className="w-5 h-5" /> Tirar selfie
            </button>
            <button
              onClick={handleSkipSelfie}
              className="w-full text-white/50 text-xs text-center py-2 hover:text-white/50 transition-colors"
            >
              Pular esta etapa
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mt-6"
          >
            <Shield className="w-3.5 h-3.5" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/50 text-xs">Sua foto não é armazenada nem compartilhada</span>
          </motion.div>
        </>
      )}

      {selfieAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          {selfiePreview ? (
            <div className="relative mb-8">
              <img
                src={selfiePreview}
                alt="Sua selfie"
                className="w-36 h-36 rounded-full object-cover"
                style={{ border: `3px solid ${LIGHT_GREEN}` }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `3px solid ${LIGHT_GREEN}`, borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <div className="relative mb-8">
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: `${BTN_GREEN}40`, border: `2px solid ${LIGHT_GREEN}60` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10" style={{ color: LIGHT_GREEN }} />
              </motion.div>
              <PulsingRing delay={0} />
              <PulsingRing delay={0.6} />
              <PulsingRing delay={1.2} />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 w-full max-w-xs"
          >
            {(selfiePreview ? selfieLoadingTexts : skipLoadingTexts).map((text, i) => {
              const totalTexts = selfiePreview ? selfieLoadingTexts.length : skipLoadingTexts.length;
              const interval = (selfiePreview ? 5.5 : 4.5) / totalTexts;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * interval, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * interval, type: "spring" }}
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${BTN_GREEN}30`, border: `1px solid ${LIGHT_GREEN}50` }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + i * interval }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: LIGHT_GREEN }} />
                    </motion.div>
                  </motion.div>
                  <span className="text-white/70 text-sm font-medium">{text}</span>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="w-full max-w-xs mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${BTN_GREEN}, ${LIGHT_GREEN})` }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: selfiePreview ? 6 : 5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );

  const renderOffer = () => {
    const isMale = answers['gender'] === 'Homem';

    const bonuses = [
      { img: "/images/wise/zhRQX-bonus-01.webp", title: "Guia de Ferramentas Faciais", desc: "Gua Sha, roller facial e mais ferramentas na palma da sua mão.", value: "R$ 47" },
      { img: "/images/wise/hkqyg-bonus-02.webp", title: "Ritual Matinal Anti-Inchaço", desc: "5 minutos para começar o dia com o rosto desinchado e definido.", value: "R$ 47" },
      { img: isMale ? "/images/wise/5uQgD-bonus-03.webp" : "/images/wise/checklist-feminina.webp", title: isMale ? "Checklist de Presença Masculina" : "Checklist de Presença Feminina", desc: "Tudo que você precisa para transmitir confiança e presença.", value: "R$ 67" },
      { img: "/images/wise/L03sj-bonus-04.webp", title: "Plano de Manutenção Pós 21 Dias", desc: "Mantenha os resultados para sempre com esse guia de rotina.", value: "R$ 67" },
    ];

    const scrollToCta = () => {
      document.getElementById('cta-principal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const ctaBlock = (
      <div id="cta-principal" className="p-6 rounded-3xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIGHT_GREEN}30` }}>
        <p className="text-white/50 text-sm mb-1">Acesso imediato ao</p>
        <h3 className="text-xl font-bold text-white mb-1">Protocolo TSR</h3>
        <p className="text-white/50 text-xs mb-4">+ 4 bônus exclusivos (valor total: R$ 228)</p>
        <div className="mb-1">
          <span className="text-white/50 text-sm line-through mr-2">R$ 147,00</span>
        </div>
        <div className="mb-1">
          <span className="text-3xl font-bold text-white">4x de </span>
          <span className="text-3xl font-bold" style={{ color: LIGHT_GREEN }}>R$ 5,84</span>
        </div>
        <p className="text-white/40 text-sm mb-5">ou <strong className="text-white">R$ 19,99</strong> à vista</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${AMBER}20`, color: AMBER }}>
          <Clock className="w-3 h-3" /> Oferta expira em {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
        </div>
        <a
          href="https://checkout.protocolotsr.shop/VCCL1O8SCVP1"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4 mb-3"
          style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
        >
          QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </a>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/40 text-xs">Garantia 7 dias</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/40 text-xs">Acesso vitalício</span>
          </div>
        </div>
      </div>
    );

    const ctaBlockScroll = (
      <div className="p-6 rounded-3xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIGHT_GREEN}30` }}>
        <p className="text-white/50 text-sm mb-1">Acesso imediato ao</p>
        <h3 className="text-xl font-bold text-white mb-1">Protocolo TSR</h3>
        <p className="text-white/50 text-xs mb-4">+ 4 bônus exclusivos (valor total: R$ 228)</p>
        <div className="mb-1">
          <span className="text-white/50 text-sm line-through mr-2">R$ 147,00</span>
        </div>
        <div className="mb-1">
          <span className="text-3xl font-bold text-white">4x de </span>
          <span className="text-3xl font-bold" style={{ color: LIGHT_GREEN }}>R$ 5,84</span>
        </div>
        <p className="text-white/40 text-sm mb-5">ou <strong className="text-white">R$ 19,99</strong> à vista</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${AMBER}20`, color: AMBER }}>
          <Clock className="w-3 h-3" /> Oferta expira em {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
        </div>
        <button
          onClick={scrollToCta}
          className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4 mb-3"
          style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
        >
          QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </button>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/40 text-xs">Garantia 7 dias</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/40 text-xs">Acesso vitalício</span>
          </div>
        </div>
      </div>
    );

    const bonusSection = (
      <div className="px-5 mb-8">
        <div className="text-center mb-5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: AMBER }}>🎁 Bônus Exclusivos</span>
          <h2 className="text-lg font-bold text-white mt-1">Incluídos na sua compra</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bonuses.map((bonus, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="rounded-2xl overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            >
              <img src={bonus.img} alt={bonus.title} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-white text-xs font-bold leading-snug mb-1">{bonus.title}</p>
                <p className="text-white/40 text-xs leading-snug mb-2">{bonus.desc}</p>
                <p className="text-white/50 text-xs line-through">De: {bonus.value}</p>
                <p className="text-xs font-bold" style={{ color: LIGHT_GREEN }}>Por: R$0</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );

    const garantiaSection = (
      <div className="px-5 mb-8">
        <div className="flex items-center gap-4 p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <img src="/images/wise/IAxfL-garantia-7-dias.webp" alt="Garantia 7 dias" className="w-20 h-20 object-contain flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm mb-1">Garantia de 7 Dias de Devolução</p>
            <p className="text-white/50 text-xs leading-relaxed mb-2">Se em 7 dias você não estiver satisfeito com os resultados, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.</p>
            <p className="text-xs font-bold" style={{ color: LIGHT_GREEN }}>Risco zero. Transformação garantida.</p>
          </div>
        </div>
      </div>
    );

    if (isMale) {
      // ── SCRIPT DE OURO (MASCULINO) ──
      const maleTestimonials = [
        { img: "/images/nosso-quiz/masculino/novo1.webp", name: "Marcos", age: "32 anos", text: "Achei que era minha genética. Em 10 dias de TSR, minha mandíbula apareceu. Minha namorada perguntou se eu fiz preenchimento." },
        { img: "/images/nosso-quiz/masculino/novo2.webp", name: "Felipe", age: "27 anos", text: "O inchaço matinal sumiu. Eu parecia um balão nas fotos, agora meu rosto tem ângulo. Valeu cada centavo." },
        { img: "/images/wise/AqrzV-argumentos-4.webp", name: "Thiago A.", age: "36 anos", text: "São 5 minutos por dia. Em menos de 3 semanas meu rosto ficou completamente diferente — mais definido, mais jovem, mais presente." },
      ];

      const maleResultImages = [
        "/images/nosso-quiz/masculino/resultado-04.webp",
        "/images/nosso-quiz/masculino/resultado-03.webp",
        "/images/nosso-quiz/masculino/resultado-01.webp",
      ];

      const maleMetrics = [
        { label: "Definição Facial", before: 12, after: 88 },
        { label: "Confiança",        before: 15, after: 85 },
        { label: "Presença",         before: 10, after: 90 },
        { label: "Auto-estima",      before: 12, after: 88 },
      ];

      const maleFaqs = [
        { q: "Quanto tempo por dia?", a: "Apenas 5 minutos, em qualquer lugar. O protocolo foi desenhado para encaixar na rotina masculina sem esforço." },
        { q: "Em quanto tempo vejo resultado?", a: "A descompressão linfática é visível nos primeiros 4 dias. A definição óssea — mandíbula e contorno — ocorre entre o dia 14 e 21." },
        { q: "É seguro?", a: "100% natural, baseado em fisioterapia facial e drenagem avançada. Sem produtos, sem agulhas, sem risco." },
        { q: "Preciso comprar produtos ou ferramentas?", a: "Não. O protocolo funciona apenas com as mãos. As ferramentas são opcionais e estão cobertas no bônus — mas não são necessárias para ter resultados." },
        { q: "Funciona para qualquer idade?", a: "Sim. O protocolo é eficaz para todas as idades que buscam eliminar a retenção facial e ganhar definição." },
      ];

      return (
        <div className="pb-20" style={{ background: DARK_BG }}>

          {/* ── HERO ── */}
          <div className="px-5 pt-10 pb-6 text-center">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 uppercase tracking-widest"
              style={{ background: `${BTN_GREEN}30`, color: LIGHT_GREEN, border: `1px solid ${LIGHT_GREEN}30` }}
            >
              <Sparkles className="w-3 h-3" /> Seu plano está pronto
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-white leading-tight mb-2"
            >
              Elimine a Retenção Facial e tenha uma <span style={{ color: LIGHT_GREEN }}>Mandíbula Definida</span> em apenas 21 dias
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-white/50 text-sm mb-5 leading-relaxed"
            >
              Baseado nas suas respostas, você tem alto potencial de definição.
            </motion.p>

            {/* CTA primeira dobra */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
              <button
                onClick={scrollToCta}
                className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4"
                style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
              >
                QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>
              <p className="text-white/50 text-xs mt-2 text-center">Garantia 7 dias • Acesso imediato • R$19,99</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
              className="rounded-2xl overflow-hidden border border-white/10 mb-6"
            >
              <img src="/images/nosso-quiz/masculino/seu-rosto-e-moldavel.webp" alt="Antes e depois" className="w-full h-auto" />
            </motion.div>

            {/* Métricas */}
            <div className="space-y-3 text-left">
              {maleMetrics.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">{m.label}</span>
                    <span className="font-bold" style={{ color: LIGHT_GREEN }}>{m.before}% → {m.after}%</span>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <motion.div className="absolute left-0 top-0 h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${BTN_GREEN}, ${LIGHT_GREEN})` }}
                      initial={{ width: `${m.before}%` }}
                      animate={{ width: `${m.after}%` }}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-white/25 text-xs text-center mt-3">Com base nos dados das suas respostas</p>
          </div>

          {/* ── O QUE TERÁ ACESSO ── */}
          <div className="px-5 mb-8">
            <h2 className="text-lg font-bold text-white mb-5 text-center">O que você terá acesso?</h2>
            <div className="space-y-3">
              {[
                { title: "Protocolo PDF Passo a Passo", desc: "Guia completo com cada exercício ilustrado em detalhe" },
                { title: "Plano Personalizado de 21 Dias", desc: "Cronograma dia a dia para encaixar na sua rotina" },
                { title: "Trilha da Transformação Facial", desc: "Sequência completa para definição facial em 21 dias" },
                { title: "Técnicas de Drenagem Linfática Facial", desc: "Elimine a retenção e o inchaço de forma natural" },
                { title: "Exercícios de Definição de Mandíbula", desc: "Ative o masseter e o platisma para marcar o contorno" },
                { title: "Guia de Hábitos Potencializadores", desc: "Nutrição, sono e hidratação para maximizar resultados" },
                { title: "Checklist Diário de Progresso", desc: "Acompanhe sua evolução dia a dia" },
                { title: "Suporte Dedicado", desc: "Tire suas dúvidas e receba apoio durante a jornada" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${BTN_GREEN}50` }}>
                    <Check className="w-3.5 h-3.5" style={{ color: LIGHT_GREEN }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── PARA QUEM É ── */}
          <div className="px-5 mb-8">
            <div className="p-5 rounded-2xl" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <p className="text-center text-base font-bold text-white mb-4">Para quem é o Protocolo de 21 dias?</p>
              <div className="space-y-2.5">
                {[
                  "Quer eliminar a papada e o inchaço facial",
                  "Busca uma mandíbula mais definida e marcada",
                  "Quer transmitir mais confiança e presença",
                  "Não tem tempo para procedimentos caros ou invasivos",
                  "Tem 5–10 minutos disponíveis por dia",
                  "Prefere métodos naturais, sem cirurgia ou botox",
                  "Quer resultados visíveis em poucas semanas",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: LIGHT_GREEN }} />
                    <span className="text-white/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 mb-8">{ctaBlock}</div>

          {/* ── PROVA SOCIAL COM CARROSSEL ── */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-1 text-center px-5">Resultados de quem já aplicou</h2>
            <p className="text-white/40 text-sm mb-4 text-center px-5">+2.000 homens transformados</p>
            <div className="relative overflow-hidden mb-3">
              <motion.div key={resultsSlide} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="px-5">
                {resultsSlide === maleResultImages.length - 1 ? (
                  <div className="w-full rounded-2xl overflow-hidden">
                    <img
                      src={maleResultImages[resultsSlide]}
                      alt="Antes e depois"
                      className="w-full h-auto"
                      style={{ marginTop: '-27%', marginBottom: '-4%' }}
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden" style={{ maxHeight: '420px' }}>
                    <img src={maleResultImages[resultsSlide]} alt="Antes e depois" className="w-full h-auto object-cover object-top" />
                  </div>
                )}
              </motion.div>
            </div>
            <div className="flex justify-center gap-2 mb-5">
              {maleResultImages.map((_, i) => (
                <button key={i} onClick={() => setResultsSlide(i)} className="rounded-full transition-all duration-200"
                  style={{ width: i === resultsSlide ? '20px' : '8px', height: '8px', background: i === resultsSlide ? LIGHT_GREEN : 'rgba(255,255,255,0.25)' }}
                />
              ))}
            </div>
            <div className="px-5 space-y-3">
              {maleTestimonials.map((dep, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                  className="p-4 rounded-2xl"
                  style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img src={dep.img} alt={dep.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{dep.name}, {dep.age}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" style={{ color: AMBER }} />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">"{dep.text}"</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── BÔNUS ── */}
          {bonusSection}

          <div className="px-5 mb-6">{ctaBlockScroll}</div>

          {/* ── GARANTIA ── */}
          {garantiaSection}

          {/* ── FAQ TÉCNICO ── */}
          <div className="px-5 mb-8">
            <h2 className="text-lg font-bold text-white mb-5 text-center">Perguntas frequentes</h2>
            <div className="space-y-2">
              {maleFaqs.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <button
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-white text-sm font-medium leading-snug">{faq.q}</span>
                    <span className="text-2xl flex-shrink-0 transition-transform duration-200" style={{ color: LIGHT_GREEN, transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      );
    }

    // ── OFERTA FEMININA ──
    const femaleTestimonials = [
      { beforeAfter: "/images/nosso-quiz/feminino/depoimentos7.webp", img: "/images/nosso-quiz/feminino/dep1.webp", name: "Ana P.", age: "32 anos", text: "Eu evitava tirar fotos porque não gostava do meu rosto. Depois do protocolo, meu rosto ficou muito mais contornado e definido." },
      { img: "/images/nosso-quiz/feminino/dep2.webp", name: "Mariana S.", age: "27 anos", text: "Logo na primeira semana já notei redução do inchaço. Continuei seguindo o protocolo e agora tenho o rosto que sempre quis." },
      { img: "/images/nosso-quiz/feminino/dep3.webp", name: "Juliana T.", age: "38 anos", text: "Sempre tive um rosto mais redondo e isso me incomodava. Em 10 dias já dava para notar diferença. Com 21 dias, meu contorno está definido de verdade!" },
      { img: "/images/nosso-quiz/feminino/dep4.webp", name: "Camila R.", age: "34 anos", text: "Achei que seria complicado, mas é super simples. 15 minutos por dia e os resultados aparecem rápido. Meu rosto ficou muito mais bonito. Recomendo!" },
      { img: "/images/nosso-quiz/feminino/dep5.webp", name: "Fernanda G.", age: "41 anos", text: "No começo achei que era bobagem, mas resolvi testar. Depois de 2 semanas, minha amiga perguntou se eu tinha mudado algo. Funcionou mesmo!" },
    ] as Array<{ img?: string; beforeAfter?: string; name: string; age: string; text: string }>;

    const femaleResultImages = [
      "/images/nosso-quiz/feminino/reviews-1-slider-paywall.webp",
      "/images/nosso-quiz/feminino/reviews-5-slider-paywall.webp",
      "/images/nosso-quiz/feminino/reviews-3-slider-paywall.webp",
      "/images/nosso-quiz/feminino/reviews-4-slider-paywall.webp",
      "/images/nosso-quiz/feminino/reviews-2-slider-paywall.webp",
    ];

    const femaleMetrics = [
      { label: "Atratividade", before: 15, after: 85 },
      { label: "Confiança",    before: 10, after: 90 },
      { label: "Respeito",     before: 15, after: 85 },
      { label: "Auto-estima",  before: 10, after: 90 },
    ];

    const femaleFaqs = [
      { q: "Nunca fiz exercício facial antes. É adequado para iniciantes?", a: "Sim! O protocolo foi desenvolvido para iniciantes, com passo a passo ilustrado, demonstrações detalhadas e linguagem simples para uma progressão segura." },
      { q: "Quanto tempo preciso me dedicar por dia?", a: "10 a 15 minutos por dia é o suficiente. Muitos notam redução do inchaço e definição visível já na primeira semana." },
      { q: "Preciso comprar produtos ou ferramentas caras?", a: "Não. O protocolo funciona apenas com as mãos. As ferramentas são opcionais e estão cobertas no bônus — mas não são necessárias para ter resultados." },
      { q: "Funciona para qualquer idade?", a: "Sim. O protocolo é eficaz para todas as idades que buscam eliminar a retenção facial e ganhar definição." },
      { q: "Posso cancelar e obter reembolso?", a: "Sim. Você tem 7 dias de garantia total. Basta solicitar e devolvemos 100% do valor, sem perguntas." },
    ];

    return (
      <div className="pb-20" style={{ background: DARK_BG }}>

        {/* ── HERO ── */}
        <div className="px-5 pt-10 pb-6 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 uppercase tracking-widest"
            style={{ background: `${BTN_GREEN}30`, color: LIGHT_GREEN, border: `1px solid ${LIGHT_GREEN}30` }}
          >
            <Sparkles className="w-3 h-3" /> Seu plano está pronto
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-white leading-tight mb-2"
          >
            Elimine a Retenção Facial e tenha um <span style={{ color: LIGHT_GREEN }}>Rosto Definido</span> em apenas 21 dias
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/50 text-sm mb-5 leading-relaxed"
          >
            Baseado nas suas respostas, você tem alto potencial de definição.
          </motion.p>

          {/* CTA primeira dobra */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
            <button
              onClick={scrollToCta}
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4"
              style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
            >
              QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>
            <p className="text-white/50 text-xs mt-2 text-center">Garantia 7 dias • Acesso imediato • R$19,99</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
            className="rounded-2xl overflow-hidden border border-white/10 mb-6"
          >
            <img src="/images/nosso-quiz/feminino/depoimentos6.webp" alt="Antes e depois" className="w-full h-auto" />
          </motion.div>

          {/* Métricas */}
          <div className="space-y-3 text-left">
            {femaleMetrics.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60 font-medium">{m.label}</span>
                  <span className="font-bold" style={{ color: LIGHT_GREEN }}>{m.before}% → {m.after}%</span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <motion.div className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${BTN_GREEN}, ${LIGHT_GREEN})` }}
                    initial={{ width: `${m.before}%` }}
                    animate={{ width: `${m.after}%` }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-white/25 text-xs text-center mt-3">Com base nos dados das suas respostas</p>
        </div>

        {/* O que terá acesso */}
        <div className="px-5 mb-8">
          <h2 className="text-lg font-bold text-white mb-5 text-center">O que você terá acesso?</h2>
          <div className="space-y-3">
            {[
              { title: "Protocolo PDF Passo a Passo", desc: "Guia completo com cada exercício ilustrado em detalhe" },
              { title: "Plano Personalizado de 21 Dias", desc: "Cronograma dia a dia completo para sua rotina" },
              { title: "Trilha da Transformação Facial", desc: "Sequência completa para definição facial em 21 dias" },
              { title: "Técnicas de Drenagem Linfática Facial", desc: "Elimine a retenção e o inchaço de forma natural" },
              { title: "Massagens de Definição e Contorno", desc: "Defina o maxilar, maçãs do rosto e contorno facial" },
              { title: "Guia de Hábitos Potencializadores", desc: "Nutrição, sono e hidratação para maximizar resultados" },
              { title: "Checklist Diário de Progresso", desc: "Acompanhe sua evolução dia a dia" },
              { title: "Suporte Dedicado", desc: "Tire suas dúvidas e receba apoio durante a jornada" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${BTN_GREEN}50` }}>
                  <Check className="w-3.5 h-3.5" style={{ color: LIGHT_GREEN }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Para quem é */}
        <div className="px-5 mb-8">
          <div className="p-5 rounded-2xl" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <p className="text-center text-base font-bold text-white mb-4">🚨 Para quem é o Protocolo de 21 dias?</p>
            <div className="space-y-2.5">
              {[
                "Quer eliminar a retenção e o inchaço facial",
                "Busca definição facial natural e eficaz",
                "Quer melhorar beleza e confiança",
                "Não tem tempo para procedimentos caros ou invasivos",
                "Tem 10–15 minutos disponíveis por dia",
                "Prefere métodos simples, científicos e validados",
                "Quer resultados visíveis sem cirurgia ou botox",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: LIGHT_GREEN }} />
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 mb-8">{ctaBlock}</div>

        {/* Depoimentos */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-1 text-center px-5">Resultados de quem já aplicou</h2>
          <p className="text-white/40 text-sm mb-4 text-center px-5">+2.000 pessoas transformadas</p>
          <div className="relative overflow-hidden mb-3">
            <motion.div key={resultsSlide} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="px-5">
              <img src={femaleResultImages[resultsSlide]} alt="Antes e depois" className="w-full h-auto rounded-2xl" />
            </motion.div>
          </div>
          <div className="flex justify-center gap-2 mb-5">
            {femaleResultImages.map((_, i) => (
              <button key={i} onClick={() => setResultsSlide(i)} className="rounded-full transition-all duration-200"
                style={{ width: i === resultsSlide ? '20px' : '8px', height: '8px', background: i === resultsSlide ? LIGHT_GREEN : 'rgba(255,255,255,0.25)' }}
              />
            ))}
          </div>
          <div className="px-5 space-y-3">
            {femaleTestimonials.map((dep, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                className="p-4 rounded-2xl" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {dep.img ? (
                    <img src={dep.img} alt={dep.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: BTN_GREEN, color: LIGHT_GREEN }}>
                      {dep.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{dep.name}, {dep.age}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" style={{ color: AMBER }} />)}
                    </div>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">"{dep.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>

        {bonusSection}
        <div className="px-5 mb-6">{ctaBlockScroll}</div>
        {garantiaSection}

        {/* FAQ feminino */}
        <div className="px-5 mb-8">
          <h2 className="text-lg font-bold text-white mb-5 text-center">Perguntas frequentes</h2>
          <div className="space-y-2">
            {femaleFaqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <button className="w-full flex items-center justify-between gap-3 p-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-white text-sm font-medium leading-snug">{faq.q}</span>
                  <span className="text-2xl flex-shrink-0 transition-transform duration-200" style={{ color: LIGHT_GREEN, transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-4">
                    <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step.type) {
      case "info":
        return renderInfoScreen();
      case "gender":
        return renderGenderQuestion();
      case "single":
        return renderSingleQuestion();
      case "grid":
        return renderGridQuestion();
      case "age":
        return renderAge();
      case "testimonials":
        return renderTestimonials();
      case "selfie":
        return renderSelfie();
      case "offer":
        return renderOffer();
      default:
        return renderSingleQuestion();
    }
  };

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: DARK_BG }}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col" ref={containerRef}>
        {renderHeader()}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
        {step.type === "offer" && (
          <div className="sticky bottom-0 z-50 px-4 py-3" style={{ background: `linear-gradient(to top, ${DARK_BG}, ${DARK_BG}ee, transparent)` }}>
            <button
              onClick={() => document.getElementById('cta-principal')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-white font-bold text-sm"
              style={{ background: BTN_GREEN, boxShadow: `0 4px 20px ${BTN_GREEN}80` }}
            >
              QUERO MEU PROTOCOLO <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </button>
            <p className="text-center text-white/50 text-xs mt-1">
              <Clock className="w-3 h-3 inline mr-1" style={{ color: AMBER }} />
              {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')} restantes
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
