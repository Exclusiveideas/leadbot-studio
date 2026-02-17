"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  MessagesSquare,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

type DateRange = 7 | 30 | 90;

type DailyData = {
  date: string;
  conversations: number;
  messages: number;
  leads: number;
};

type AnalyticsSummary = {
  totalConversations: number;
  totalMessages: number;
  totalLeads: number;
  conversationsTrend: number;
  messagesTrend: number;
  leadsTrend: number;
};

type AnalyticsResponse = {
  success: boolean;
  data: {
    summary: AnalyticsSummary;
    daily: DailyData[];
    days: number;
  };
};

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}

function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="bg-white border border-brand-border rounded-xl p-3 shadow-lg">
      <p className="text-xs font-medium text-brand-primary mb-1.5">
        {formatChartDate(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-brand-muted capitalize">{entry.name}:</span>
          <span className="font-medium text-brand-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [days, setDays] = useState<DateRange>(30);
  const [data, setData] = useState<AnalyticsResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("BASIC");

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.organization?.plan) {
          setPlan(s.user.organization.plan);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/chatbots/${chatbotId}/analytics?days=${days}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const result: AnalyticsResponse = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const hasAdvancedAnalytics = plan === "PRO" || plan === "AGENCY";

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, daily } = data;

  const statCards = [
    {
      label: "Conversations",
      value: summary.totalConversations,
      trend: summary.conversationsTrend,
      icon: MessageSquare,
      color: "#3784ff",
    },
    {
      label: "Messages",
      value: summary.totalMessages,
      trend: summary.messagesTrend,
      icon: MessagesSquare,
      color: "#8b5cf6",
    },
    {
      label: "Leads Captured",
      value: summary.totalLeads,
      trend: summary.leadsTrend,
      icon: UserPlus,
      color: "#f59e0b",
    },
  ];

  const chartData = daily.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
  }));

  return (
    <div className="space-y-8">
      {/* Header with date range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-brand-muted">
            Performance over the last {days} days
          </p>
        </div>
        <div className="flex items-center gap-1 bg-brand-surface rounded-lg p-1">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-brand-muted hover:text-brand-primary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-brand-border p-5 elevation-1"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}12` }}
              >
                <card.icon
                  className="h-4.5 w-4.5"
                  style={{ color: card.color }}
                />
              </div>
              <TrendBadge value={card.trend} />
            </div>
            <p className="text-2xl font-bold tracking-tight text-brand-primary">
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs text-brand-muted mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="relative">
        {/* Conversations Chart */}
        <div className="bg-white rounded-xl border border-brand-border p-6 elevation-1 mb-4">
          <h3 className="text-sm font-semibold text-brand-primary mb-4">
            Conversations & Leads
          </h3>
          <div
            className={`h-[280px] ${!hasAdvancedAnalytics ? "blur-[6px] pointer-events-none select-none" : ""}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorConversations"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3784ff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3784ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="#3784ff"
                  strokeWidth={2}
                  fill="url(#colorConversations)"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Messages Chart */}
        <div className="bg-white rounded-xl border border-brand-border p-6 elevation-1">
          <h3 className="text-sm font-semibold text-brand-primary mb-4">
            Messages
          </h3>
          <div
            className={`h-[220px] ${!hasAdvancedAnalytics ? "blur-[6px] pointer-events-none select-none" : ""}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorMessages"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upgrade Overlay for Basic plan */}
        {!hasAdvancedAnalytics && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm border border-brand-border rounded-2xl p-8 text-center shadow-lg max-w-sm mx-4">
              <div className="h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-brand-muted" />
              </div>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">
                Advanced Analytics
              </h3>
              <p className="text-sm text-brand-muted mb-5 leading-relaxed">
                Upgrade to Pro to unlock detailed charts, trends, and data
                visualization for your chatbot performance.
              </p>
              <Link
                href="/settings?tab=billing"
                className="bg-gradient-accent inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-brand-primary shadow-md hover:shadow-lg transition-all hover:brightness-105"
              >
                Upgrade to Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
