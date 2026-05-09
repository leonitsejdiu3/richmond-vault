'use client';

// Dashboard.tsx
// James Richmond — Forex Signals Group | Operations Dashboard
// Stack: React 18 + Tailwind CSS + Recharts

import { useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  telegram_username: string | null;
  full_name: string | null;
  deposit_status: "pending" | "deposited" | "withdrawn" | "failed";
  deposit_amount_usd: number;
  lots_traded: number;
  lot_target: number;
  lot_completion_pct: number;
  hours_since_deposit: number | null;
  cpa_cleared: boolean;
  funnel_stage: string;
  last_contacted_at: string | null;
  contact_attempts: number;
}

interface Stats {
  total_leads: number;
  deposited: number;
  trading_active: number;
  cpa_cleared: number;
  needs_attention: number;
  total_lots: number;
  total_deposit_volume: number;
}

// ── Palette constants ─────────────────────────────────────────────────────────

const C = {
  midnight: "#0F172A",
  slate: "#334155",
  slateLight: "#475569",
  slateMid: "#1E293B",
  white: "#FFFFFF",
  accent: "#38BDF8",
  accentMuted: "#0EA5E9",
  warn: "#F59E0B",
  danger: "#EF4444",
  success: "#10B981",
  muted: "#64748B",
};

// ── Mock data (replace with Supabase fetch) ────────────────────────────────────

const MOCK_STATS: Stats = {
  total_leads: 284,
  deposited: 191,
  trading_active: 134,
  cpa_cleared: 97,
  needs_attention: 43,
  total_lots: 487.5,
  total_deposit_volume: 384200,
};

const MOCK_NEEDS_ATTENTION: Lead[] = [
  { id: "1", telegram_username: "fx_mike_tx", full_name: "Michael Torres", deposit_status: "deposited", deposit_amount_usd: 2500, lots_traded: 0.25, lot_target: 2, lot_completion_pct: 12.5, hours_since_deposit: 38.2, cpa_cleared: false, funnel_stage: "deposited", last_contacted_at: null, contact_attempts: 1 },
  { id: "2", telegram_username: "sarah_gold22", full_name: "Sarah Okonkwo", deposit_status: "deposited", deposit_amount_usd: 1000, lots_traded: 0.0, lot_target: 2, lot_completion_pct: 0, hours_since_deposit: 51.7, cpa_cleared: false, funnel_stage: "deposited", last_contacted_at: null, contact_attempts: 0 },
  { id: "3", telegram_username: "traderkev88", full_name: "Kevin Marsh", deposit_status: "deposited", deposit_amount_usd: 5000, lots_traded: 1.25, lot_target: 2, lot_completion_pct: 62.5, hours_since_deposit: 22.1, cpa_cleared: false, funnel_stage: "trading", last_contacted_at: "2025-05-08T14:00:00Z", contact_attempts: 2 },
  { id: "4", telegram_username: "dana_pips", full_name: "Dana Whitfield", deposit_status: "deposited", deposit_amount_usd: 3000, lots_traded: 0.75, lot_target: 2, lot_completion_pct: 37.5, hours_since_deposit: 29.0, cpa_cleared: false, funnel_stage: "trading", last_contacted_at: null, contact_attempts: 1 },
  { id: "5", telegram_username: "uk_fx_james", full_name: "James Boateng", deposit_status: "deposited", deposit_amount_usd: 1500, lots_traded: 0.0, lot_target: 2, lot_completion_pct: 0, hours_since_deposit: 72.4, cpa_cleared: false, funnel_stage: "deposited", last_contacted_at: null, contact_attempts: 3 },
];

const MOCK_FUNNEL_DATA = [
  { stage: "Captured", count: 284 },
  { stage: "Contacted", count: 231 },
  { stage: "Linked", count: 204 },
  { stage: "Deposited", count: 191 },
  { stage: "Trading", count: 134 },
  { stage: "Cleared", count: 97 },
];

const MOCK_VOLUME_TREND = [
  { day: "Mon", lots: 42, deposits: 28 },
  { day: "Tue", lots: 67, deposits: 35 },
  { day: "Wed", lots: 53, deposits: 19 },
  { day: "Thu", lots: 88, deposits: 41 },
  { day: "Fri", lots: 101, deposits: 48 },
  { day: "Sat", lots: 79, deposits: 12 },
  { day: "Sun", lots: 58, deposits: 8 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent = false, danger = false
}: {
  label: string; value: string | number; sub?: string;
  accent?: boolean; danger?: boolean;
}) {
  const highlight = danger ? C.danger : accent ? C.accent : C.white;
  return (
    <div
      className="flex flex-col justify-between p-5 rounded-xl"
      style={{
        background: C.slateMid,
        border: `1px solid ${C.slate}`,
        aspectRatio: "16/9",
      }}
    >
      <span style={{ color: C.muted, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ color: highlight, fontSize: "2.4rem", fontWeight: 700, lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ color: C.muted, fontSize: "0.75rem" }}>{sub}</span>
      )}
    </div>
  );
}

function StatusRing({ stats }: { stats: Stats }) {
  const active = stats.trading_active;
  const atRisk = stats.needs_attention;
  const cleared = stats.cpa_cleared;
  const dormant = stats.deposited - active - atRisk;

  const data = [
    { name: "Active", value: active },
    { name: "Needs Attention", value: atRisk },
    { name: "CPA Cleared", value: cleared },
    { name: "Dormant", value: Math.max(dormant, 0) },
  ];

  const RING_COLORS = [C.accent, C.warn, C.success, C.slate];

  return (
    <div
      className="flex flex-col p-5 rounded-xl"
      style={{
        background: C.slateMid,
        border: `1px solid ${C.slate}`,
        aspectRatio: "16/9",
      }}
    >
      <span style={{ color: C.muted, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
        Book Breakdown
      </span>
      <div className="flex flex-1 items-center gap-4">
        <div style={{ flex: "0 0 55%" }}>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={RING_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: C.midnight, border: `1px solid ${C.slate}`, borderRadius: 8, color: C.white }}
                // THE FIX IS HERE: Bypassing the strict type check
                formatter={(v: any) => [v, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: RING_COLORS[i], flexShrink: 0 }} />
              <span style={{ color: C.muted, fontSize: "0.72rem", flex: 1 }}>{d.name}</span>
              <span style={{ color: C.white, fontSize: "0.8rem", fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LotProgressBar({ pct, lots, target }: { pct: number; lots: number; target: number }) {
  const color = pct === 0 ? C.danger : pct < 50 ? C.warn : pct < 100 ? C.accent : C.success;
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span style={{ color: C.muted, fontSize: "0.65rem" }}>{lots.toFixed(2)} / {target} lots</span>
        <span style={{ color, fontSize: "0.65rem", fontWeight: 600 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ background: C.slate, borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function NeedsAttentionPanel({ leads }: { leads: Lead[] }) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden h-full"
      style={{ background: C.slateMid, border: `1px solid ${C.slate}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.slate}` }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.warn, boxShadow: `0 0 8px ${C.warn}` }} />
          <span style={{ color: C.white, fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Needs Attention
          </span>
        </div>
        <span style={{ background: C.warn + "22", color: C.warn, fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
          {leads.length} members
        </span>
      </div>

      {/* Table head */}
      <div
        className="grid px-5 py-2"
        style={{
          gridTemplateColumns: "2fr 1fr 2fr 1fr",
          borderBottom: `1px solid ${C.slate}`,
        }}
      >
        {["Member", "Deposited", "Lot Progress", "Hours"].map((h) => (
          <span key={h} style={{ color: C.muted, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {leads.map((lead, i) => (
          <div
            key={lead.id}
            className="grid px-5 py-3 items-center"
            style={{
              gridTemplateColumns: "2fr 1fr 2fr 1fr",
              borderBottom: i < leads.length - 1 ? `1px solid ${C.slate}33` : "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.slate + "44")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div>
              <div style={{ color: C.white, fontSize: "0.78rem", fontWeight: 600 }}>
                {lead.full_name ?? lead.telegram_username ?? "—"}
              </div>
              {lead.telegram_username && (
                <div style={{ color: C.muted, fontSize: "0.65rem" }}>@{lead.telegram_username}</div>
              )}
            </div>
            <div>
              <span style={{ color: C.white, fontSize: "0.78rem" }}>
                ${lead.deposit_amount_usd.toLocaleString()}
              </span>
            </div>
            <div className="pr-4">
              <LotProgressBar pct={lead.lot_completion_pct} lots={lead.lots_traded} target={lead.lot_target} />
            </div>
            <div>
              {lead.hours_since_deposit !== null ? (
                <span style={{
                  color: lead.hours_since_deposit > 48 ? C.danger : C.warn,
                  fontSize: "0.75rem", fontWeight: 600
                }}>
                  {lead.hours_since_deposit.toFixed(0)}h
                </span>
              ) : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VolumeTrend() {
  return (
    <div
      className="flex flex-col p-5 rounded-xl"
      style={{ background: C.slateMid, border: `1px solid ${C.slate}`, aspectRatio: "16/9" }}
    >
      <span style={{ color: C.muted, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        7-Day Volume Trend
      </span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_VOLUME_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lotsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
              <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.slate + "55"} />
          <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: C.midnight, border: `1px solid ${C.slate}`, borderRadius: 8, color: C.white }}
          />
          <Area type="monotone" dataKey="lots" name="Lots Traded" stroke={C.accent} fill="url(#lotsGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="deposits" name="Deposits" stroke={C.success} fill="none" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FunnelBar() {
  return (
    <div
      className="flex flex-col p-5 rounded-xl"
      style={{ background: C.slateMid, border: `1px solid ${C.slate}`, aspectRatio: "16/9" }}
    >
      <span style={{ color: C.muted, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Funnel Stage Breakdown
      </span>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MOCK_FUNNEL_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.slate + "55"} vertical={false} />
          <XAxis dataKey="stage" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: C.midnight, border: `1px solid ${C.slate}`, borderRadius: 8, color: C.white }}
          />
          <Bar dataKey="count" name="Members" fill={C.accentMuted} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats] = useState<Stats>(MOCK_STATS);
  const [attention] = useState<Lead[]>(MOCK_NEEDS_ATTENTION);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => setLastRefresh(new Date()), []);

  return (
    <div
      className="min-h-screen"
      style={{ background: C.midnight, fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      {/* ── Top Bar ── */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: `1px solid ${C.slate}`, background: C.midnight }}
      >
        <div className="flex flex-col">
          <span style={{ color: C.white, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            JAMES RICHMOND
          </span>
          <span style={{ color: C.muted, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Forex Signals — Operations
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
            <span style={{ color: C.muted, fontSize: "0.7rem" }}>Live</span>
          </div>
          <button
            onClick={refresh}
            style={{
              background: "none", border: `1px solid ${C.slate}`, color: C.muted,
              padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", cursor: "pointer",
              letterSpacing: "0.05em"
            }}
          >
            Refresh
          </button>
          <span style={{ color: C.muted, fontSize: "0.65rem" }}>
            {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </header>

      <main className="px-8 py-6 flex flex-col gap-6">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricCard label="Total Leads" value={stats.total_leads} sub="All time captured" />
          <MetricCard label="Deposited" value={stats.deposited} sub="FTD confirmed" accent />
          <MetricCard label="Active Traders" value={stats.trading_active} sub="≥0.1 lots this week" accent />
          <MetricCard label="CPA Cleared" value={stats.cpa_cleared} sub="≥2.0 lots complete" />
          <MetricCard label="Needs Attention" value={stats.needs_attention} sub="Deposited, not trading" danger />
          <MetricCard label="Total Lots" value={stats.total_lots.toFixed(1)} sub={`$${(stats.total_deposit_volume / 1000).toFixed(0)}k volume`} />
        </div>

        {/* ── Ring + Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatusRing stats={stats} />
          <VolumeTrend />
          <FunnelBar />
        </div>

        {/* ── Needs Attention ── */}
        <NeedsAttentionPanel leads={attention} />

        {/* ── Footer ── */}
        <div className="flex justify-between items-center pt-2 pb-4">
          <span style={{ color: C.muted, fontSize: "0.65rem" }}>
            James Richmond Forex Signals Group · Internal Operations Dashboard
          </span>
          <span style={{ color: C.muted, fontSize: "0.65rem" }}>
            Connect Supabase realtime to activate live data
          </span>
        </div>
      </main>
    </div>
  );
}