import type { PlanId } from '@botfolks/shared';

export interface Me {
  id: number;
  email: string;
  name: string;
  workspaceId: number;
  plan: PlanId;
  credits: number;
}
