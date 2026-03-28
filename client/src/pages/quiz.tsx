import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Star, Check, ArrowRight, Sparkles, Clock, Shield, TrendingUp, Award, Users, Loader2, Camera, ScanFace } from "lucide-react";
import { quizTracker } from "../lib/tracking";
import { CheckoutEmbutido } from "../components/CheckoutEmbutido";

type QuizAnswer = Record<string, string | string[]>;

interface QuizStep {
  id: string;
  section: string;
  type: "single" | "multi" | "grid" | "info" | "email" | "offer" | "age" | "skin-color" | "skin-problems" | "face-shape" | "statement" | "results" | "timeline" | "comparison" | "steps" | "features" | "testimonials" | "loading" | "splash" | "preloader" | "gender" | "selfie" | "welcome";
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
    infoTitle: "Por que dormir de lado está deformando seu rosto",
    infoSubtitle: "A descoberta que pode reverter anos de danos faciais em 90 segundos por dia.",
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
    question: "Sem filtro: qual desses momentos você já viveu?",
    options: [
      { label: "Deletei uma foto minha antes que alguém visse", emoji: "🗑️" },
      { label: "Fingi que minha câmera estava com problema pra não aparecer no vídeo", emoji: "📵" },
      { label: "Alguém me perguntou se eu estava doente — eu não estava", emoji: "😷" },
      { label: "Me olhei numa foto e não aceitei que era eu", emoji: "🪞" },
    ],
  },
  {
    id: "social-impact",
    section: "Perfil",
    type: "single",
    question: "Há quanto tempo você convive com isso?",
    options: [
      { label: "Menos de 6 meses", emoji: "⏳" },
      { label: "Entre 6 meses e 2 anos", emoji: "📅" },
      { label: "Mais de 2 anos", emoji: "🗓️" },
      { label: "Faz tanto tempo que nem lembro como era antes", emoji: "😶" },
    ],
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
    id: "selfie",
    section: "Programa",
    type: "selfie",
    question: "Tire uma selfie para gerar seu diagnóstico facial",
    subtitle: "Sua foto será analisada para criar um protocolo 100% personalizado para o seu rosto.",
  },
  {
    id: "email",
    section: "Programa",
    type: "email",
    question: "Onde enviamos seu protocolo?",
    subtitle: "Seu diagnóstico foi concluído. Insira seu email para receber o resultado personalizado.",
  },
  {
    id: "personalization",
    section: "Programa",
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
// Steps: 0 welcome, 1 age, 2 insecurity, 3 face-pain, 4 social-impact,
// 5 face-goals, 6 selfie, 7 email, 8 personalization, 9 offer
const SEGMENTS = [
  { start: 1, end: 4, label: "Perfil" },
  { start: 5, end: 6, label: "Análise" },
  { start: 7, end: 7, label: "Diagnóstico" },
  { start: 8, end: 8, label: "Programa" },
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
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [resultsSlide, setResultsSlide] = useState(0);
  const [bonusSlide, setBonusSlide] = useState(0);
  const [countdown, setCountdown] = useState({ minutes: 14, seconds: 59 });

  // Track quiz start on mount and handle abandonment on unmount
  useEffect(() => {
    quizTracker.trackQuizStart(QUIZ_STEPS.length);

    // Track abandonment when user leaves the page
    const handleBeforeUnload = () => {
      if (currentStep < QUIZ_STEPS.length - 1) {
        quizTracker.trackQuizAbandon(QUIZ_STEPS[currentStep].id, currentStep, QUIZ_STEPS.length);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Track abandonment if quiz not completed
      if (currentStep < QUIZ_STEPS.length - 1) {
        quizTracker.trackQuizAbandon(QUIZ_STEPS[currentStep].id, currentStep, QUIZ_STEPS.length);
      }
    };
  }, [currentStep]);
  useEffect(() => {
    if (QUIZ_STEPS[currentStep]?.type !== 'offer') return;
    const len = answers['gender'] === 'Masculino' ? 3 : 5;
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

    // Track section view
    quizTracker.trackSectionView(step.id, currentStep, QUIZ_STEPS.length);
  }, [currentStep]);

  const goNext = useCallback(() => {
    if (isAnimating) return;

    // Track section completion before moving to next
    quizTracker.trackSectionComplete(step.id, currentStep, QUIZ_STEPS.length,
      step.type === "multi" || step.type === "grid" || step.type === "skin-problems" ? selectedOptions : answers[step.id]);

    if (step.type === "multi" || step.type === "grid" || step.type === "skin-problems") {
      setAnswers((prev) => ({ ...prev, [step.id]: selectedOptions }));
    }
    setDirection(1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => {
        const nextStep = Math.min(prev + 1, QUIZ_STEPS.length - 1);
        // Check if quiz is complete
        if (nextStep === QUIZ_STEPS.length - 1) {
          quizTracker.trackQuizComplete(QUIZ_STEPS.length);
        }
        return nextStep;
      });
      setIsAnimating(false);
    }, 300);
  }, [currentStep, selectedOptions, step, isAnimating, answers]);

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

      // Track section completion with the selected answer
      quizTracker.trackSectionComplete(step.id, currentStep, QUIZ_STEPS.length, option);

      setAnswers((prev) => ({ ...prev, [step.id]: option }));
      setDirection(1);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => {
          const nextStep = Math.min(prev + 1, QUIZ_STEPS.length - 1);
          // Check if quiz is complete
          if (nextStep === QUIZ_STEPS.length - 1) {
            quizTracker.trackQuizComplete(QUIZ_STEPS.length);
          }
          return nextStep;
        });
        setIsAnimating(false);
      }, 500);
    },
    [step, isAnimating, currentStep]
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
        className="sticky top-0 z-50 px-4 pt-1 pb-1"
        style={{ background: HEADER_BG }}
      >
        <div className="flex items-center justify-between mb-1">
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
          <span className="text-white/70 text-xs font-semibold">{step.section || "Progresso"}</span>
          <div className="flex items-center gap-1.5">
          </div>
        </div>
        {/* 6-segment progress bar */}
        <div className="flex gap-1">
          {SEGMENTS.map((_, i) => {
            const segIdx = i + 1;
            const filled = segIdx < activeSegment ? 1 : segIdx === activeSegment ? segmentFill : 0;
            return (
              <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
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

  const renderWelcome = () => {
    const handleGenderSelect = (gender: string) => {
      setAnswers((prev) => ({ ...prev, gender: gender }));
      setDirection(1);
      setIsAnimating(true);

      // Track the selection
      quizTracker.trackSectionComplete('welcome', 0, QUIZ_STEPS.length, gender);

      setTimeout(() => {
        setCurrentStep(1); // Go to age question (index 1)
        setIsAnimating(false);
      }, 500);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-center min-h-screen px-6 py-8 max-w-md mx-auto"
      >
        {/* Headline Bencivenga Style */}
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-black text-white text-center mb-6 leading-tight"
          data-testid="text-welcome-title"
        >
          Por que{" "}
          <span className="text-red-400">dormir de lado</span>{" "}
          está{" "}
          <span className="text-red-400">deformando seu rosto</span>
          <br />
          <span className="text-lg sm:text-xl text-white/80 font-semibold whitespace-nowrap">
            (e como 3 exercícios simples revertem isso)
          </span>
        </motion.h1>

        {/* Subheadline Bencivenga */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/80 text-lg text-center mb-10"
        >
          Essa descoberta pode{" "}
          <span className="text-white font-semibold">
            reverter danos faciais
          </span>{" "}
          em 90 segundos por dia
        </motion.p>

        {/* Call to Action Simples */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/70 text-base text-center mb-8"
        >
          Qual seu gênero?
        </motion.p>

        {/* Gender Selection - HALBERT: "Choose Your Path" */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 w-full"
        >
          <div className="flex-1 flex flex-col items-center">
            <button
              onClick={() => handleGenderSelect("Feminino")}
              className="w-full relative overflow-hidden rounded-2xl transition-all duration-300 border-2 group h-40 mb-3"
              style={{
                borderColor: 'rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src="/images/mulher-novo.webp"
                alt="Feminino"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: '50% 20%' }}
              />
            </button>
            <p className="text-white font-bold text-lg">Feminino</p>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <button
              onClick={() => handleGenderSelect("Masculino")}
              className="w-full relative overflow-hidden rounded-2xl transition-all duration-300 border-2 group h-40 mb-3"
              style={{
                borderColor: 'rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src="/images/homem-novo.webp"
                alt="Masculino"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: '50% 20%' }}
              />
            </button>
            <p className="text-white font-bold text-lg">Masculino</p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/30 text-xs text-center mt-4"
        >
          Teste gratuito • 90 segundos • Sem cadastro
        </motion.p>
      </motion.div>
    );
  };

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
                      src={(opt.imageMale && answers['gender'] === 'Masculino') ? opt.imageMale : opt.image}
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
                src={answers['gender'] === 'Masculino'
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
            className="w-full rounded-2xl overflow-hidden mb-4 border border-white/10"
          >
            <img
              src={answers['gender'] === 'Masculino'
                ? "/images/nosso-quiz/masculino/isso-nao-e-so-estetica.webp"
                : "/images/nosso-quiz/feminino/isso-nao-e-so-estetica.webp"}
              alt="Antes e depois"
              className="w-full max-h-48 object-contain"
            />
          </motion.div>
        )}
        {isStatementMoldavel && (step.statementImage || step.statementImageMale) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-2xl overflow-hidden mb-4 border border-white/10"
          >
            <img
              src={(step.statementImageMale && answers['gender'] === 'Masculino') ? step.statementImageMale : step.statementImage}
              alt="Rosto moldável"
              className="w-full max-h-48 object-contain"
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
            className="w-full space-y-1 mb-4"
          >
            {(answers['gender'] === 'Feminino' ? [
              { label: "Contorno das Bochechas", pct: 94 },
              { label: "Redução de Papada", pct: 89 },
              { label: "Simetria Facial", pct: 86 },
            ] : [
              { label: "Definição da Mandíbula", pct: 93 },
              { label: "Contorno dos Olhos", pct: 87 },
              { label: "Simetria Facial", pct: 84 },
            ]).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-white/70 text-xs">{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: LIGHT_GREEN }}>{item.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
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
    const isMale = answers['gender'] === 'Masculino';
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
    <div className="px-5 pt-6 pb-6 flex flex-col items-center min-h-[80vh] justify-center">
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
            className="relative mb-6"
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: `${BTN_GREEN}30`, border: `2px solid ${LIGHT_GREEN}40` }}
            >
              <ScanFace className="w-14 h-14" style={{ color: LIGHT_GREEN }} />
            </div>
            <PulsingRing delay={0} />
            <PulsingRing delay={0.8} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-white text-center mb-2 leading-tight"
          >
            {step.question}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm text-center mb-6 max-w-xs leading-relaxed"
          >
            {step.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 mb-4"
          >
            <p className="text-sm font-semibold text-white mb-2">📍 Por que fazer o diagnóstico?</p>
            <div className="space-y-1 text-xs text-white/70">
              <p>• Dormir de lado pressiona e distorce os músculos</p>
              <p>• Causa flacidez por falta de tônus muscular</p>
              <p>• Acelera o envelhecimento facial</p>
            </div>
            <p className="text-xs mt-2.5 text-green-400 font-semibold">
              ✅ Vamos identificar onde aplicar os 3 exercícios que revertem esses danos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs space-y-2"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 text-base font-bold rounded-2xl text-white transition-all active:scale-95 flex items-center justify-center gap-2"
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
            className="flex items-center gap-2 p-3 bg-black/30 rounded-xl border border-white/20 mt-4"
          >
            <Shield className="w-4 h-4" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/70 text-sm font-bold">Sua foto não é armazenada nem compartilhada</span>
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

  const renderEmail = () => {
    const submitEmail = () => {
      const val = emailInput.trim();
      if (!val) { setEmailError('Insira seu email para continuar.'); return; }
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!valid) { setEmailError('Email inválido. Verifique e tente novamente.'); return; }
      setEmail(val);
      setEmailError('');
      quizTracker.trackSectionComplete(step.id, currentStep, QUIZ_STEPS.length, val);
      (window as any).utmify?.track('Lead', { content_name: 'Quiz Email' });
      goNext();
    };

    return (
      <div className="px-5 pt-12 pb-6 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${BTN_GREEN}30`, border: `1px solid ${LIGHT_GREEN}40` }}>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke={LIGHT_GREEN} strokeWidth="1.5" fill="none" />
                <path d="M22 6l-10 7L2 6" stroke={LIGHT_GREEN} strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2 leading-tight">{step.question}</h2>
          <p className="text-white/50 text-sm text-center mb-8 leading-relaxed">{step.subtitle}</p>
          <input
            type="email"
            placeholder="seu@email.com"
            value={emailInput}
            onChange={e => { setEmailInput(e.target.value); if (emailError) setEmailError(''); }}
            onKeyDown={e => e.key === 'Enter' && submitEmail()}
            className="w-full rounded-2xl px-5 py-4 text-white placeholder-white/30 text-base outline-none mb-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${emailError ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
            autoFocus
          />
          {emailError && <p className="text-red-400 text-sm px-1 mb-3">{emailError}</p>}
          <button
            onClick={submitEmail}
            className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-base mt-2"
            style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
          >
            Ver meu protocolo <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-white/30 text-xs text-center mt-4">
            Não enviamos spam. Seus dados são protegidos.
          </p>
        </motion.div>
      </div>
    );
  };

  const renderOffer = () => {
    const isMale = answers['gender'] === 'Masculino';

    const bonuses = [
      { img: "/images/wise/zhRQX-bonus-01.webp", title: "Guia de Ferramentas Faciais", desc: "Gua Sha, roller facial e mais ferramentas na palma da sua mão.", value: "R$ 47" },
      { img: "/images/wise/hkqyg-bonus-02.webp", title: "Ritual Matinal Anti-Inchaço", desc: "5 minutos para começar o dia com o rosto desinchado e definido.", value: "R$ 47" },
      { img: isMale ? "/images/wise/5uQgD-bonus-03.webp" : "/images/wise/checklist-feminina.webp", title: isMale ? "Checklist de Presença Masculina" : "Checklist de Presença Feminina", desc: "Tudo que você precisa para transmitir confiança e presença.", value: "R$ 67" },
      { img: "/images/wise/L03sj-bonus-04.webp", title: "Plano de Manutenção Pós 21 Dias", desc: "Mantenha os resultados para sempre com esse guia de rotina.", value: "R$ 67" },
    ];

    const handleOfferClick = () => {
      quizTracker.trackOfferClick("inline_checkout");
      (window as any).utmify?.track('InitiateCheckout', { value: 29.90, currency: 'BRL' });
      setShowCheckout(true);
      setTimeout(() => {
        document.getElementById('cta-principal')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    };

    const handlePaymentSuccess = (payment: any) => {
      (window as any).utmify?.track('Purchase', {
        orderId: String(payment.id),
        revenue: 29.90,
        currency: 'BRL',
        paymentMethod: payment.payment_method_id || 'credit_card',
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    };

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
          <span className="text-3xl font-bold text-white">12x de </span>
          <span className="text-3xl font-bold" style={{ color: LIGHT_GREEN }}>R$ 2,49</span>
        </div>
        <p className="text-white/40 text-sm mb-5">ou <strong className="text-white">R$ 29,90</strong> à vista</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${AMBER}20`, color: AMBER }}>
          <Clock className="w-3 h-3" /> Oferta expira em {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
        </div>
        {!showCheckout ? (
          <>
            <button
              onClick={handleOfferClick}
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4 mb-3"
              style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
            >
              QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
                <span className="text-white/40 text-xs">Garantia 90 dias</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
                <span className="text-white/40 text-xs">Acesso vitalício</span>
              </div>
            </div>
          </>
        ) : (
          <CheckoutEmbutido email={emailInput} amount={29.90} description="Protocolo TSR" onSuccess={handlePaymentSuccess} />
        )}
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
          <span className="text-3xl font-bold text-white">12x de </span>
          <span className="text-3xl font-bold" style={{ color: LIGHT_GREEN }}>R$ 2,49</span>
        </div>
        <p className="text-white/40 text-sm mb-5">ou <strong className="text-white">R$ 29,90</strong> à vista</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${AMBER}20`, color: AMBER }}>
          <Clock className="w-3 h-3" /> Oferta expira em {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
        </div>
        <button
          onClick={handleOfferClick}
          className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-white font-bold text-sm sm:text-base px-4 mb-3"
          style={{ background: BTN_GREEN, boxShadow: `0 8px 28px ${BTN_GREEN}60` }}
        >
          QUERO MEU PROTOCOLO AGORA <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </button>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: LIGHT_GREEN }} />
            <span className="text-white/40 text-xs">Garantia 90 dias</span>
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
          <img src="/images/wise/garantia-90-dias.png" alt="Garantia 90 dias" className="w-28 h-28 object-contain flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm mb-1">Garantia Incondicional de 90 Dias</p>
            <p className="text-white/50 text-xs leading-relaxed mb-2">Se em 90 dias você não estiver completamente satisfeito com os resultados, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.</p>
            <p className="text-xs font-bold" style={{ color: LIGHT_GREEN }}>Risco zero. Transformação garantida.</p>
          </div>
        </div>
      </div>
    );

    if (paymentSuccess) {
      return (
        <div className="px-5 pt-16 pb-20 flex flex-col items-center text-center min-h-screen" style={{ background: DARK_BG }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: `${BTN_GREEN}40`, border: `2px solid ${LIGHT_GREEN}` }}
          >
            <Check className="w-10 h-10" style={{ color: LIGHT_GREEN }} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-3"
          >
            Pagamento confirmado!
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-white/60 text-sm leading-relaxed max-w-xs mb-8"
          >
            Seu acesso ao Protocolo TSR foi liberado. Verifique seu email <span className="text-white font-medium">{email}</span> para acessar o conteúdo.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: `${BTN_GREEN}20`, border: `1px solid ${LIGHT_GREEN}30` }}
          >
            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: LIGHT_GREEN }} />
            <p className="text-white/60 text-xs">Garantia de 90 dias. Satisfação total ou seu dinheiro de volta.</p>
          </motion.div>
        </div>
      );
    }

    if (isMale) {
      // ── SCRIPT DE OURO (MASCULINO) ──
      const maleTestimonials = [
        { img: "/images/nosso-quiz/masculino/novo1.webp", name: "Marcos", age: "32 anos", text: "Em 10 dias minha mandíbula apareceu. Minha namorada perguntou se fiz preenchimento." },
        { img: "/images/nosso-quiz/masculino/novo2.webp", name: "Felipe", age: "27 anos", text: "O inchaço matinal sumiu. Agora meu rosto tem ângulo definido." },
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
      ];

      const maleFaqs = [
        { q: "Quanto tempo por dia?", a: "Apenas 90 segundos por dia. O protocolo foi desenhado para encaixar na rotina masculina sem esforço." },
        { q: "Em quanto tempo vejo resultado?", a: "Os primeiros resultados aparecem em 4-7 dias. A definição completa ocorre em 21 dias." },
        { q: "Preciso comprar algo extra?", a: "Não. Os 3 exercícios funcionam apenas com as mãos, sem produtos ou ferramentas." },
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
              Reverta os danos do <span style={{ color: LIGHT_GREEN }}>sono lateral</span> e recupere a definição facial em 90 segundos por dia
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-white/50 text-sm mb-5 leading-relaxed"
            >
              3 exercícios simples que desfazem a deformação causada por dormir de lado.
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
              <p className="text-white/50 text-xs mt-2 text-center">Garantia 90 dias • Acesso imediato • R$39,90</p>
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
            <h2 className="text-lg font-bold text-white mb-5 text-center">Os 3 Exercícios Que Revertem os Danos</h2>
            <div className="space-y-3">
              {[
                { title: "Exercício #1: Descompressão Temporal", desc: "Desfaz a pressão acumulada pela posição lateral durante o sono" },
                { title: "Exercício #2: Reposicionamento Facial", desc: "Realinha os músculos e tecidos deformados pelo peso da cabeça" },
                { title: "Exercício #3: Ativação do Contorno", desc: "Reativa a circulação e redefine as linhas faciais naturais" },
                { title: "Protocolo Completo 90 Segundos", desc: "Sequência exata para reverter danos em apenas 90 segundos por dia" },
                { title: "Guia de Posicionamento Correto", desc: "Como dormir para evitar novos danos faciais" },
                { title: "Cronograma de 21 Dias", desc: "Plano dia a dia para máximos resultados" },
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
                  "Dorme de lado e percebe deformação facial",
                  "Nota assimetria ou achatamento de um lado do rosto",
                  "Quer reverter danos causados pela posição do sono",
                  "Busca solução natural sem procedimentos invasivos",
                  "Tem apenas 90 segundos por dia disponíveis",
                  "Prefere exercícios simples baseados em ciência",
                  "Quer recuperar a simetria e definição natural",
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
      { img: "/images/nosso-quiz/feminino/dep1.webp", name: "Ana P.", age: "32 anos", text: "Depois do protocolo, meu rosto ficou muito mais contornado e definido." },
      { img: "/images/nosso-quiz/feminino/dep2.webp", name: "Mariana S.", age: "27 anos", text: "Na primeira semana já notei redução do inchaço. Agora tenho o rosto que sempre quis." },
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
      { label: "Auto-estima",  before: 10, after: 90 },
    ];

    const femaleFaqs = [
      { q: "Quanto tempo por dia?", a: "Apenas 90 segundos por dia. Os 3 exercícios são rápidos e simples de fazer." },
      { q: "Em quanto tempo vejo resultado?", a: "Os primeiros resultados aparecem em 4-7 dias. A transformação completa em 21 dias." },
      { q: "Preciso comprar algo extra?", a: "Não. Os exercícios funcionam apenas com as mãos, sem produtos ou ferramentas." },
      { q: "Tenho garantia?", a: "Sim. 90 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor." },
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
            Reverta os danos do <span style={{ color: LIGHT_GREEN }}>sono lateral</span> e recupere a beleza natural em 90 segundos por dia
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/50 text-sm mb-5 leading-relaxed"
          >
            3 exercícios simples que desfazem a deformação causada por dormir de lado.
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
            <p className="text-white/50 text-xs mt-2 text-center">Garantia 90 dias • Acesso imediato • R$39,90</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
            className="rounded-2xl overflow-hidden border border-white/10 mb-6"
          >
            <img src="/images/nosso-quiz/feminino/seu-rosto-e-moldavel.webp" alt="Rosto moldável" className="w-full h-auto" />
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
          <h2 className="text-lg font-bold text-white mb-5 text-center">Os 3 Exercícios Que Revertem os Danos</h2>
          <div className="space-y-3">
            {[
              { title: "Exercício #1: Descompressão Temporal", desc: "Desfaz a pressão acumulada pela posição lateral durante o sono" },
              { title: "Exercício #2: Reposicionamento Facial", desc: "Realinha os músculos e tecidos deformados pelo peso da cabeça" },
              { title: "Exercício #3: Ativação do Contorno", desc: "Reativa a circulação e redefine as linhas faciais naturais" },
              { title: "Protocolo Completo 90 Segundos", desc: "Sequência exata para reverter danos em apenas 90 segundos por dia" },
              { title: "Guia de Posicionamento Correto", desc: "Como dormir para evitar novos danos faciais" },
              { title: "Cronograma de 21 Dias", desc: "Plano dia a dia para máximos resultados" },
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
                "Dorme de lado e nota deformação no rosto",
                "Percebe assimetria ou achatamento facial",
                "Quer reverter danos causados pela posição do sono",
                "Busca solução natural sem procedimentos invasivos",
                "Tem apenas 90 segundos por dia disponíveis",
                "Prefere exercícios simples baseados em ciência",
                "Quer recuperar a beleza e simetria natural",
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
      case "email":
        return renderEmail();
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
        {step.type === "offer" && !paymentSuccess && (
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
