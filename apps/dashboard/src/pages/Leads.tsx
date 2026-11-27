import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';

interface LeadListItem {
  id: number;
  bot_id: number;
  bot_code: string;
  bot_name: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  need: string | null;
  created_at: string;
}

interface BotOption {
  code: string;
  name: string;
}

export default function Leads() {
  const [params, setParams] = useSearchParams();
  const botCode = params.get('bot') ?? '';

  const bots = useQuery({ queryKey: ['bots'], queryFn: () => api<BotOption[]>('/bots') });
  const leads = useQuery({
    queryKey: ['leads', botCode],
    queryFn: () => api<LeadListItem[]>(`/bots/leads${botCode ? `?bot=${botCode}` : ''}`),
  });

  const loading = leads.isLoading;
  const list = leads.data ?? [];
  const selectedBot = bots.data?.find((b) => b.code === botCode);

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Leads</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Contact details visitors have shared with your bots.</p>
        </div>
        {bots.data && bots.data.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filter by bot"
              value={botCode}
              onChange={(e) => setParams(e.target.value ? { bot: e.target.value } : {})}
              options={[{ value: '', label: 'All bots' }, ...bots.data.map((b) => ({ value: b.code, label: b.name }))]}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No leads yet"
          description={selectedBot ? `${selectedBot.name} hasn't captured any leads yet.` : 'Leads captured by your bots will show up here.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[720px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[13px] font-medium text-muted">
                <th className="px-4 py-3 font-medium">Bot</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Need</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-white/[.025]">
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    <Link to={`/bots/${l.bot_code}`} className="hover:underline">
                      {l.bot_name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">{l.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">{l.email ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">{l.phone ?? '—'}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-text">{l.need ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
