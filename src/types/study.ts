export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  source?: 'local' | 'groq';
}

export interface AchievementItem {
  title: string;
  description: string;
  unlocked: boolean;
}
