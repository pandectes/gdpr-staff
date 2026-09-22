import { redirect } from 'react-router';
import { endSession } from '~/.server/auth';
import type { Route } from './+types/logout';

export async function action({ request }: Route.ActionArgs) {
  return redirect('/login', { headers: { 'Set-Cookie': await endSession(request) } });
}

export async function loader() {
  return redirect('/');
}
