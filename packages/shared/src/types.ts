export type BotStatus = 'draft' | 'training' | 'ready' | 'error';

export interface Bot {
  id: number;
  workspaceId: number;
  publicKey: string;
  name: string;
  status: BotStatus;
  welcomeMessage: string;
  languages: string[];
}

export interface TrainJob { botId: number; sourceId: number; }

export const QUEUES = { train: 'train', embed: 'embed' } as const;
