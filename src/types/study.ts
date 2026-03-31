export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  source?: 'local' | 'groq';
  suggestions?: string[];
  intent?: 'resumo' | 'caso' | 'quiz' | 'medicamento' | 'comparacao' | 'duvida';
}

export interface AchievementItem {
  title: string;
  description: string;
  unlocked: boolean;
}
