import { redirect } from 'next/navigation';

/** No pitch selected yet — send them to the list with a prompt rather than an empty shell. */
export default function ReviewPicker() {
  redirect('/dashboard?pick=review');
}
