import { getAdminUserId } from '@/lib/supabase';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { cookies } from 'next/headers';
import { ROLE_COOKIE } from '@/lib/cookies';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUserId = await getAdminUserId();
  const isAdmin = Boolean(adminUserId);

  // Demo fallback: check the scaffold_role cookie set by auth-actions
  if (!isAdmin) {
    const jar = await cookies();
    const role = jar.get(ROLE_COOKIE)?.value;
    if (role !== 'admin' && role !== 'super_admin') {
      return <>{children}</>;
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-view">{children}</div>
      </main>
    </div>
  );
}
