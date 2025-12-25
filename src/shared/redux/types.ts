import { AsyncStatus } from './enums';

export interface AsyncState {
  status: AsyncStatus;
  error: string | null;
}

