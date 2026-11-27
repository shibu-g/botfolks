import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';

interface ConversationListItem {
  id: number;
  bot_id: number;
  bot_code: string;
  bot_name: string;
  visitor_id: string;
  page_url: string | null;
  language: string | null;
  message_count: number;
  last_message: string | null;
  created_at: string;
}

interface BotOption {
  code: string;
  name: string;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const botCode = params.get('bot') ?? '';

  const bots = useQuery({ queryKey: ['bots'], queryFn: () => api<BotOption[]>('/bots') });
  const conversations = useQuery({
    queryKey: ['conversations', botCode],
    queryFn: () => api<ConversationListItem[]>(`/bots/conversations${botCode ? `?bot=${botCode}` : ''}`),
  });

  const loading = conversations.isLoading;
  const list = conversations.data ?? [];

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Conversations</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Every chat your bots have had with visitors, across all your bots.</p>
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
          icon={<MessageSquare size={22} />}
          title="No conversations yet"
          description={botCode ? 'This bot has not had any conversations yet.' : 'Conversations your bots have with visitors will show up here.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[13px] font-medium text-muted">
                <th className="px-4 py-3 font-medium">Bot</th>
                <th className="px-4 py-3 font-medium">Last message</th>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/conversations/${c.id}`)}
                  className="cursor-pointer border-b border-line transition-colors duration-150 last:border-0 hover:bg-white/[.025]"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-text">{c.bot_name}</td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-text">{c.last_message ?? '—'}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted">{c.page_url ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">{c.message_count}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
