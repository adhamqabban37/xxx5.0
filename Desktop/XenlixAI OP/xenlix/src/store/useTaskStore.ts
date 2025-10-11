'use client';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Task, TaskEvent } from '@/types/tasks';

interface TaskState {
  tasks: Task[];
  events: TaskEvent[];
  overallScore: number; // simulated
  toggleTask: (id: string) => void;
  addEvent: (event: TaskEvent) => void;
  simulateRescan: () => Promise<void>;
  addTasks: (tasks: Task[]) => void;
}

const initialTasks: Task[] = [
  {
    id: 'schema-local-business',
    title: 'Add LocalBusiness JSON-LD',
    description: 'Add schema markup to homepage <head>.',
    impact: 6,
    effort: 'Medium',
    snippet: '<script type="application/ld+json">{...}</script>',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'faq-schema',
    title: 'Add FAQPage Schema',
    description: 'Insert FAQ structured data to answer common queries.',
    impact: 5,
    effort: 'Low',
    snippet: '<script type="application/ld+json">{"@type":"FAQPage"}</script>',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meta-descriptions',
    title: 'Write Meta Descriptions',
    description: 'Add compelling meta descriptions to key pages.',
    impact: 3,
    effort: 'Low',
    snippet: '<meta name="description" content="..." />',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: initialTasks,
  events: [],
  overallScore: 58,
  addTasks: (tasks) => set((state) => ({ tasks: [...state.tasks, ...tasks] })),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  toggleTask: (id) => {
    set((state) => {
      const tasks = state.tasks.map((t) => {
        if (t.id === id) {
          const nowCompleted = t.status !== 'completed';
          const updated: Task = {
            ...t,
            status: nowCompleted ? 'completed' : 'pending',
            completedAt: nowCompleted ? new Date().toISOString() : null,
          };
          // add event
          const evt: TaskEvent = {
            id: nanoid(),
            type: nowCompleted ? 'task_completed' : 'task_unchecked',
            timestamp: new Date().toISOString(),
            message: nowCompleted
              ? `Task '${t.title}' completed${t.impact ? ` - Score +${t.impact} pts` : ''}`
              : `Task '${t.title}' unchecked`,
            meta: { taskId: t.id, impact: t.impact },
          };
          const newScore =
            nowCompleted && t.impact
              ? state.overallScore + t.impact
              : !nowCompleted && t.impact
                ? state.overallScore - t.impact
                : state.overallScore;
          return { updated, evt, newScore };
        }
        return { updated: t } as any;
      });
      // Extract updated tasks
      const flat = tasks.map((t) => t.updated as Task);
      // Events generated
      const generated = tasks.filter((t) => t.evt).map((t) => t.evt as TaskEvent);
      // Score adjustment
      const scored = tasks.find((t) => t.newScore !== undefined && t.newScore !== null);
      return {
        tasks: flat,
        events: generated.length ? [...generated, ...state.events] : state.events,
        overallScore: scored?.newScore ?? state.overallScore,
      };
    });
  },
  simulateRescan: async () => {
    const startId = nanoid();
    get().addEvent({
      id: startId,
      type: 'rescan_started',
      timestamp: new Date().toISOString(),
      message: 'Re-scan initiated...',
      meta: {},
    });
    // fake delay
    await new Promise((r) => setTimeout(r, 1800));
    // create a mock new task
    const newTask: Task = {
      id: `new-task-${Date.now()}`,
      title: 'Compress Hero Image',
      description: 'Reduce hero.jpg to <180KB and enable lazy loading.',
      impact: 4,
      effort: 'Low',
      snippet:
        '<Image src="/hero.jpg" alt="Hero banner showing XenlixAI platform" width={1200} height={600} quality={80} priority sizes="(max-width: 600px) 100vw, 1200px" loading="eager" />',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    const endId = nanoid();
    get().addEvent({
      id: endId,
      type: 'rescan_completed',
      timestamp: new Date().toISOString(),
      message: 'Re-scan complete – 1 new task detected (+4 pts potential).',
      meta: { added: 1 },
    });
  },
}));
