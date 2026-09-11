import Link from 'next/link';

export interface AdminSidebarProps {
  currentPath?: string;
}

export function AdminSidebar({ currentPath = '' }: AdminSidebarProps) {
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <aside className="admin-sidebar">
      <nav className="sidebar-nav">
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px 12px' }}>
          Archive
        </span>
        <Link
          href="/admin/submissions"
          className={isActive('/admin/submissions') ? 'active' : ''}
          style={{ ...(isActive('/admin/submissions') && { background: 'var(--purple)', color: 'var(--bg)' }) }}
        >
          Submissions
        </Link>
        <Link
          href="/admin/archive"
          className={isActive('/admin/archive') ? 'active' : ''}
          style={{ ...(isActive('/admin/archive') && { background: 'var(--purple)', color: 'var(--bg)' }) }}
        >
          Archive
        </Link>

        <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

        <button disabled style={{ opacity: '0.5', cursor: 'not-allowed' }}>
          Dashboard
        </button>
        <button disabled style={{ opacity: '0.5', cursor: 'not-allowed' }}>
          People
        </button>
        <button disabled style={{ opacity: '0.5', cursor: 'not-allowed' }}>
          Events
        </button>
        <button disabled style={{ opacity: '0.5', cursor: 'not-allowed' }}>
          Settings
        </button>

        <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px', padding: '0 12px', lineHeight: '1.4' }}>
          Coming soon
        </span>
      </nav>
    </aside>
  );
}
