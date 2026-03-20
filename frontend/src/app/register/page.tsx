import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { getSessionFromToken } from '@/lib/auth/session';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get('access_token')?.value ||
    cookieStore.get('token')?.value;
  const session = getSessionFromToken(accessToken);

  if (session) {
    redirect(session.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }

  return <RegisterForm />;
}
