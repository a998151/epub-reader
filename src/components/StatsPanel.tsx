import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Flame, Clock, BookOpen, Check, Edit3 } from 'lucide-react';
import type { ReadingSession, ThemeColors, ReadingHistory } from '@/types';

interface StatsPanelProps {
  themeColors: ThemeColors;
  sessions: ReadingSession[];
  history: ReadingHistory[];
  dailyGoalMinutes: number;
  onSetGoal: (mins: number) => void;
}

// 把 ms 转换成人可读的时长
function formatMinutes(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`;
}

// 把某天的 ms 时长
function dateKey(ts: number): string {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// 从今天往回 7/30/90 天生成日期序列
function dayRange(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function computeStreak(sessions: ReadingSession[]): number {
  if (sessions.length === 0) return 0;
  const daysWithReading = new Set(sessions.map((s) => dateKey(s.startAt)));
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // 允许今天没读但昨天有读（避免凌晨统计被清 0）
  if (!daysWithReading.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1);
    if (!daysWithReading.has(d.toISOString().slice(0, 10))) return 0;
  }
  while (daysWithReading.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function StatsPanel({
  themeColors,
  sessions,
  history,
  dailyGoalMinutes,
  onSetGoal,
}: StatsPanelProps) {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoalMinutes || 30));

  const rangeDays = dayRange(range);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    rangeDays.forEach((k) => map.set(k, 0));
    sessions.forEach((s) => {
      const k = dateKey(s.startAt);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + s.durationMs);
    });
    return rangeDays.map((k) => ({
      day: k.slice(5), // MM-DD
      fullDate: k,
      minutes: Math.round((map.get(k) ?? 0) / 60_000),
    }));
  }, [sessions, rangeDays]);

  const totalMs = sessions.reduce((s, x) => s + x.durationMs, 0);
  const rangeMs = sessions
    .filter((s) => dateKey(s.startAt) >= rangeDays[0])
    .reduce((s, x) => s + x.durationMs, 0);
  const avgPerActiveDay = (() => {
    const activeDays = new Set(
      sessions
        .filter((s) => dateKey(s.startAt) >= rangeDays[0])
        .map((s) => dateKey(s.startAt))
    ).size;
    return activeDays ? rangeMs / activeDays : 0;
  })();
  const streak = computeStreak(sessions);
  const todayMs = (byDay[byDay.length - 1]?.minutes ?? 0) * 60_000;
  const goalMs = dailyGoalMinutes * 60_000;
  const goalPct = goalMs ? Math.min(100, Math.round((todayMs / goalMs) * 100)) : 0;

  // 完成度：读完（progress === 100）的书数
  const finishedBooks = history.filter((b) => b.progress >= 98).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* 顶部大卡片：今日目标 */}
      <div
        className="rounded-[22px] p-5 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: themeColors.accent }} strokeWidth={2.2} />
            <span
              className="text-[14px] tracking-tight"
              style={{
                color: themeColors.text,
                fontFamily: '"Noto Serif SC", serif',
                fontWeight: 600,
              }}
            >
              今日阅读目标
            </span>
          </div>
          {!editingGoal ? (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-[12px] flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ color: themeColors.icon, backgroundColor: themeColors.accentSoft }}
            >
              <Edit3 size={11} />
              {dailyGoalMinutes > 0 ? `${dailyGoalMinutes} 分钟` : '设置目标'}
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const m = parseInt(goalInput, 10) || 0;
                onSetGoal(m);
                setEditingGoal(false);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="number"
                min={0}
                max={600}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-16 rounded-full px-2.5 py-1 text-[12px] text-right outline-none"
                style={{
                  backgroundColor: themeColors.accentSoft,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.glassBorder}`,
                }}
                autoFocus
              />
              <span className="text-[11px]" style={{ color: themeColors.icon }}>分/天</span>
              <button
                type="submit"
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColors.accent, color: '#fff' }}
              >
                <Check size={13} />
              </button>
            </form>
          )}
        </div>
        {dailyGoalMinutes > 0 ? (
          <>
            <div className="flex items-baseline gap-2 mb-2.5">
              <span
                className="text-[32px] tabular-nums tracking-tight"
                style={{
                  color: themeColors.accent,
                  fontFamily: '"Noto Serif SC", serif',
                  fontWeight: 600,
                }}
              >
                {Math.round(todayMs / 60_000)}
              </span>
              <span className="text-[14px]" style={{ color: themeColors.icon }}>
                / {dailyGoalMinutes} 分钟
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: themeColors.accentSoft }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.accent}cc)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${goalPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {goalPct >= 100 && (
              <div className="mt-2 text-[12px]" style={{ color: themeColors.accent, fontWeight: 500 }}>
                🎉 目标已达成，再接再厉
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px] leading-relaxed" style={{ color: themeColors.icon }}>
            设置一个每日阅读目标，让阅读成为习惯。
          </p>
        )}
      </div>

      {/* 核心指标网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame size={14} />}
          label="连续阅读"
          value={`${streak} 天`}
          themeColors={themeColors}
        />
        <StatCard
          icon={<Clock size={14} />}
          label={`近 ${range} 天时长`}
          value={formatMinutes(rangeMs)}
          themeColors={themeColors}
        />
        <StatCard
          icon={<Clock size={14} />}
          label="活跃日均"
          value={avgPerActiveDay ? formatMinutes(avgPerActiveDay) : '—'}
          themeColors={themeColors}
        />
        <StatCard
          icon={<BookOpen size={14} />}
          label="读完书籍"
          value={`${finishedBooks} 本`}
          themeColors={themeColors}
        />
      </div>

      {/* 柱状图 */}
      <div
        className="rounded-[22px] p-5 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-[14px] tracking-tight"
            style={{
              color: themeColors.text,
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 600,
            }}
          >
            每日阅读时长
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full"
               style={{ backgroundColor: themeColors.accentSoft }}>
            {([7, 30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-2.5 py-0.5 rounded-full text-[11px] transition-colors"
                style={{
                  color: range === r ? '#fff' : themeColors.icon,
                  backgroundColor: range === r ? themeColors.accent : 'transparent',
                  fontWeight: range === r ? 500 : 400,
                }}
              >
                {r}天
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={byDay} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={themeColors.accent} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={themeColors.accent} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: themeColors.icon }}
                axisLine={false}
                tickLine={false}
                interval={range === 7 ? 0 : range === 30 ? 3 : 9}
              />
              <YAxis
                tick={{ fontSize: 10, fill: themeColors.icon }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => (v === 0 ? '' : `${v}m`)}
              />
              <Tooltip
                cursor={{ fill: themeColors.accentSoft }}
                contentStyle={{
                  backgroundColor: themeColors.glass,
                  border: `1px solid ${themeColors.glassBorder}`,
                  borderRadius: 12,
                  backdropFilter: 'blur(12px)',
                  fontSize: 12,
                  color: themeColors.text,
                }}
                formatter={(v: unknown) => [`${v} 分钟`, '阅读']}
                labelFormatter={(l) => l}
              />
              <Bar
                dataKey="minutes"
                fill="url(#barColor)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px]" style={{ color: themeColors.icon }}>
          累计阅读时长：<span className="tabular-nums" style={{ color: themeColors.text, fontWeight: 500 }}>{formatMinutes(totalMs)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  themeColors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  themeColors: ThemeColors;
}) {
  return (
    <div
      className="rounded-[18px] p-3.5 glass-surface"
      style={{
        backgroundColor: themeColors.glass,
        border: `1px solid ${themeColors.glassBorder}`,
        boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 6px 18px -12px rgba(0,0,0,0.2)`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] mb-1.5"
        style={{ color: themeColors.icon }}
      >
        <span style={{ color: themeColors.accent }}>{icon}</span>
        {label}
      </div>
      <div
        className="text-[18px] tabular-nums tracking-tight"
        style={{
          color: themeColors.text,
          fontFamily: '"Noto Serif SC", serif',
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}
