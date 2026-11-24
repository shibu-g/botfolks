import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PLANS } from '@botfolks/shared';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { BotCard, type BotListItem } from '../components/BotCard';
import { CreateBotTile } from '../components/CreateBotTile';
import { BarTrend } from '../components/BarTrend';
import { BotCardSkeleton, StatCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import { formatDate } from '../lib/format';
import type { Me } from '../lib/types';

interface Analytics {
  totalBots: number;
  chatsThisMonth: number;
  leadsThisMonth: number;
  dailyChats: { date: string; chats: number }[];
  botsCreated: { period: string; count: number }[];
}

function monthLabel(period: string) {
  return new Date(`${period}-01`).toLocaleDateString('en', { month: 'short' });
}

export default function Dashboard() {
  const { me } = useOutletContext<{ me: Me }>();
  const bots = useQuery({ queryKey: ['bots'], queryFn: () => api<BotListItem[]>('/bots'), refetchInterval: 5000 });
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => api<Analytics>('/bots/analytics') });

  const loading = bots.isLoading;
  const list = bots.data ?? [];
  const recent = list.slice(0, 3);
  const a = analytics.data;
  const botLimit = PLANS[me.plan].bots;
  const atLimit = !loading && list.length >= botLimit;

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">📊 Dashboard</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Your bots, usage and activity at a glance. ✨</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {loading || analytics.isLoading ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total bots" value={list.length} icon={<span className="text-[16px]">🤖</span>} />
            <StatCard label="Chats this month" value={(a?.chatsThisMonth ?? 0).toLocaleString()} icon={<span className="text-[16px]">💬</span>} />
            <StatCard label="Leads this month" value={(a?.leadsThisMonth ?? 0).toLocaleString()} icon={<span className="text-[16px]">🧲</span>} />
            <StatCard label="Credits left" value={me.credits.toLocaleString()} icon={<span className="text-[16px]">⚡</span>} />
          </>
        )}
      </div>

      <div className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-semibold text-text">📈 Chat usage</h2>
              <p className="mt-0.5 text-[13px] text-muted">Billable chats, last 14 days</p>
            </div>
            <span className="text-[22px] font-bold tabular-nums text-text">{(a?.chatsThisMonth ?? 0).toLocaleString()}</span>
          </div>
          {analytics.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <BarTrend
              data={(a?.dailyChats ?? []).map((d) => ({ label: d.date, value: d.chats }))}
              formatTooltip={(p) => `${p.value} chat${p.value === 1 ? '' : 's'} · ${formatDate(p.label)}`}
            />
          )}
          {a?.dailyChats && a.dailyChats.length > 0 && (
            <div className="mt-2 flex justify-between text-[13px] text-subtle">
              <span>{formatDate(a.dailyChats[0].date)}</span>
              <span>{formatDate(a.dailyChats[a.dailyChats.length - 1].date)}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-semibold text-text">🤖 Bots created</h2>
              <p className="mt-0.5 text-[13px] text-muted">New bots, last 6 months</p>
            </div>
            <span className="text-[22px] font-bold tabular-nums text-text">{list.length}</span>
          </div>
          {analytics.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <BarTrend
              data={(a?.botsCreated ?? []).map((d) => ({ label: d.period, value: d.count }))}
              formatTooltip={(p) => `${p.value} bot${p.value === 1 ? '' : 's'} · ${monthLabel(p.label)}`}
            />
          )}
          {a?.botsCreated && (
            <div className="mt-2 flex justify-between text-[13px] text-subtle">
              {a.botsCreated.map((d) => (
                <span key={d.period} className="flex-1 text-center">{monthLabel(d.period)}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-[22px] font-semibold text-text">🗂️ Your bots</h2>
        <Link
          to="/bots"
          className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-accent-2 outline-none transition-colors hover:text-accent focus-visible:underline"
        >
          View all bots <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,250px)] justify-start gap-6">
        {!loading && <CreateBotTile locked={atLimit} limit={botLimit} />}
        {loading ? (
          <>
            <BotCardSkeleton /><BotCardSkeleton /><BotCardSkeleton />
          </>
        ) : (
          recent.map((b) => <BotCard key={b.id} bot={b} />)
        )}
      </div>
    </>
  );
}
