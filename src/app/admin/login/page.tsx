import { AdminLoginForm } from '@/components/admin/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink)',
    }}>
      <AdminLoginForm />
    </div>
  );
}
