import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from "lucide-react";
import type { AnalyticsMetrics, DateFilter, LeadSession } from "../../../shared/types/tracking";

const FILTER_OPTIONS = [
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "Últimos 7 dias", value: "last7days" },
  { label: "Últimos 14 dias", value: "last14days" },
  { label: "Últimos 21 dias", value: "last21days" },
  { label: "Últimos 30 dias", value: "last30days" },
];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [sessions, setSessions] = useState<LeadSession[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [metricsRes, sessionsRes] = await Promise.all([
        fetch(`/api/tracking/analytics?filter=${selectedFilter}`),
        fetch(`/api/tracking/sessions?filter=${selectedFilter}`)
      ]);

      const metricsData = await metricsRes.json();
      const sessionsData = await sessionsRes.json();

      setMetrics(metricsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Carregando analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Erro ao carregar analytics</div>
      </div>
    );
  }

  const conversionRate = metrics.totalLeads > 0
    ? (metrics.completedQuizzes / metrics.totalLeads) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics do Quiz</h1>
          <p className="text-gray-400">Acompanhe o desempenho e engajamento dos seus leads</p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Período:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFilter === option.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Total de Leads"
            value={metrics.totalLeads}
            icon={Users}
            trend={null}
            color="blue"
          />
          <MetricCard
            title="Quiz Completos"
            value={metrics.completedQuizzes}
            icon={CheckCircle}
            trend={conversionRate}
            color="green"
            suffix={`(${formatPercentage(conversionRate)})`}
          />
          <MetricCard
            title="Cliques na Oferta"
            value={metrics.offerClicks}
            icon={ArrowUpRight}
            trend={metrics.offerConversionRate}
            color="green"
            suffix={`(${formatPercentage(metrics.offerConversionRate)})`}
          />
          <MetricCard
            title="Abandonos"
            value={metrics.abandonedQuizzes}
            icon={XCircle}
            trend={metrics.totalLeads > 0 ? -((metrics.abandonedQuizzes / metrics.totalLeads) * 100) : 0}
            color="red"
          />
          <MetricCard
            title="Tempo Médio"
            value={formatTime(metrics.averageTimeToComplete)}
            icon={Clock}
            trend={null}
            color="purple"
            isTime
          />
        </div>

        {/* Section Performance */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Desempenho por Seção
          </h2>
          <div className="space-y-4">
            {metrics.sectionMetrics.map((section) => (
              <div key={section.sectionId} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium">Seção {section.sectionIndex + 1}: {section.sectionId}</span>
                    <div className="text-xs text-gray-400 mt-1">
                      {section.viewCount} visualizações • {section.completionCount} conclusões
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      {formatPercentage(section.completionRate)} completaram
                    </div>
                    <div className="text-xs text-gray-400">
                      Tempo médio: {formatTime(section.averageTimeSpent / 1000)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${section.completionRate}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-green-500 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop-off Points */}
        {metrics.dropOffPoints.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Pontos de Abandono
            </h2>
            <div className="space-y-3">
              {metrics.dropOffPoints.slice(0, 5).map((point) => (
                <div key={point.sectionId} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div>
                    <span className="text-sm font-medium">Seção {point.sectionIndex + 1}</span>
                    <span className="text-xs text-gray-400 ml-2">{point.sectionId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{point.dropOffCount} abandonos</span>
                    <span className="text-sm font-semibold text-red-400">
                      {formatPercentage(point.dropOffRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Sessões Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
                  <th className="pb-3">Lead ID</th>
                  <th className="pb-3">Início</th>
                  <th className="pb-3">Progresso</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Última Atividade</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((session) => (
                  <tr key={session.id} className="border-b border-gray-800">
                    <td className="py-3 text-sm font-mono text-gray-300">
                      {session.leadId.slice(-8)}...
                    </td>
                    <td className="py-3 text-sm">
                      {new Date(session.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${session.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{session.completionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {session.completedAt ? (
                        <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                          Completo
                        </span>
                      ) : session.abandonedAt ? (
                        <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">
                          Abandonou
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded">
                          Em andamento
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {new Date(session.lastActiveAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: number | null;
  color: "blue" | "green" | "red" | "purple";
  suffix?: string;
  isTime?: boolean;
}

function MetricCard({ title, value, icon: Icon, trend, color, suffix }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-900 text-blue-300",
    green: "bg-green-900 text-green-300",
    red: "bg-red-900 text-red-300",
    purple: "bg-purple-900 text-purple-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">
        {value} {suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  );
}