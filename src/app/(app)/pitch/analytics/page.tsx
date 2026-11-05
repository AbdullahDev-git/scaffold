import { redirect } from 'next/navigation';

export default function AnalyticsPicker() {
  redirect('/dashboard?pick=analytics');
}
