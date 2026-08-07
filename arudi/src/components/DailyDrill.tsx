import { dailyDrill } from '@/lib/exercises';
import { ExerciseRunner } from './ExerciseRunner';

/** تدريب اليوم — يُولَّد على الخادم فيكون واحداً لكل الزوار في اليوم نفسه. */
export function DailyDrill() {
  const exercises = dailyDrill();
  return <ExerciseRunner exercises={exercises} compact />;
}
