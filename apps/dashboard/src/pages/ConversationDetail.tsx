import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bot as BotIcon, User, Globe, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

interface Conversation {
  id: number;
  bot_id: number;
  bot_code: string;
  bot_name: string;
  visitor_id: string;
  page_url: string | null;
  language: string | null;
  created_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api<{ conversation: Conversation; messages: Message[] }>(`/bots/conversations/${id}`),
  });

  if (q.isLoading) {
    return <div className="h-40 animate-pulse-soft rounded-lg border border-line bg-surface" />;
  }

  if (!q.data) {
    return (
      <EmptyState
        icon={<MessageSquare size={22} />}
        title="Conversation not found"
        description="It may have been removed, or you don't have access to it."
        action={
          <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={() => navigate('/conversations')}>
            Back to conversations
          </Button>
        }
      />
    );
  }

  const { conversation: c, messages } = q.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/conversations" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted transition-colors hover:text-text">
          <ArrowLeft size={15} /> Back to conversations
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BotIcon size={18} className="text-accent" />
              <Link to={`/bots/${c.bot_code}`} className="text-[18px] font-semibold text-text hover:underline">
                {c.bot_name}
              </Link>
            </div>
            <p className="mt-1 text-[13px] text-muted">Started {formatDate(c.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[13px] text-muted">
            {c.page_url && (
              <span className="inline-flex items-center gap-1.5">
                <Globe size={14} /> {c.page_url}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> Visitor {c.visitor_id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        {messages.length === 0 ? (
          <EmptyState icon={<MessageSquare size={22} />} title="No messages" description="This conversation doesn't have any messages yet." />
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[min(540px,85%)] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-[14.5px] leading-relaxed
                    ${isUser ? 'bg-[image:var(--accent-grad)] text-white' : 'border border-line bg-surface-2 text-text'}`}
                >
                  {m.content}
                </div>
                <span className="px-1 text-[12px] text-subtle">
                  {isUser ? 'Visitor' : m.role === 'system' ? 'System' : c.bot_name} · {timeFormatter.format(new Date(m.created_at))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
