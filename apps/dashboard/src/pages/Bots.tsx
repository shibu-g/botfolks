import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { PLANS } from '@botfolks/shared';
import { api } from '../lib/api';
import { BotCard, type BotListItem } from '../components/BotCard';
import { CreateBotTile } from '../components/CreateBotTile';
import { BotCardSkeleton } from '../components/ui/Skeleton';
import type { Me } from '../lib/types';

export default function Bots() {
  const { me } = useOutletContext<{ me: Me }>();
  const bots = useQuery({ queryKey: ['bots'], queryFn: () => api<BotListItem[]>('/bots'), refetchInterval: 5000 });

  const loading = bots.isLoading;
  const list = bots.data ?? [];
  const botLimit = PLANS[me.plan].bots;
  const atLimit = !loading && list.length >= botLimit;

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Your bots</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Create, train and embed AI support bots on your websites.</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,250px)] justify-start gap-6">
        {!loading && <CreateBotTile locked={atLimit} limit={botLimit} />}
        {loading ? (
          <>
            <BotCardSkeleton /><BotCardSkeleton /><BotCardSkeleton />
          </>
        ) : (
          list.map((b) => <BotCard key={b.id} bot={b} />)
        )}
      </div>
    </>
  );
}
