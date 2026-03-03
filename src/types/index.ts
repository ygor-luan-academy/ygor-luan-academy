export type { Database } from './database.types';

import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];
export type MentorshipSession = Database['public']['Tables']['mentorship_sessions']['Row'];
export type Material = Database['public']['Tables']['materials']['Row'];

export type LessonWithProgress = Lesson & {
  progress?: UserProgress;
};

export type ModuleWithLessons = Module & {
  lessons: LessonWithProgress[];
};
