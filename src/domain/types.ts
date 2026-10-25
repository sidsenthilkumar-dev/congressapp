export type Entry = {
  date: string;
  pain: number;
  energy: string;
  note: string;
};
export type Session = {
  date: string;
  name: string;
  reps: number;
  durationSeconds?: number;
  target?: number;
  exerciseId?: string;
  routineId?: string;
  runId?: string;
  routineFinished?: boolean;
};
export type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  notes: string;
  days: number[];
  createdAt: string;
};
