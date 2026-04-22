export const MINUTES_PER_QUESTION: Record<string, Record<string, number>> = {
  technical: { junior: 3, mid: 4, senior: 5 },
  coding: { junior: 6, mid: 8, senior: 10 },
  system_design: { junior: 8, mid: 10, senior: 12 },
  behavioral: { junior: 2, mid: 3, senior: 3 },
  mixed: { junior: 4, mid: 5, senior: 6 },
};

export function getDefaultTimeEstimate(category: string, difficulty: string): number {
  const cat = category.toLowerCase();
  const diff = difficulty.toLowerCase();
  
  const minutes = MINUTES_PER_QUESTION[cat]?.[diff] || 5;
  return minutes * 60; // convert to seconds
}
