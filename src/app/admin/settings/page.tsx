import { adminStore } from '@/lib/db';
import { SettingsForm } from '@/components/admin/settings-form';

export default async function AdminSettings() {
  const adb = await adminStore();
  const settings = await adb.getSettings();

  return (
    <>
      <h1 className="h1">Settings</h1>
      <p className="view-sub">System configuration. Changes are logged to the audit trail.</p>

      <SettingsForm settings={settings} />
    </>
  );
}
