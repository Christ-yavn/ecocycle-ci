"use client";

import { FolderSearch, AlertTriangle } from 'lucide-react';

interface StateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: StateProps) {
  return (
    <div className="card text-center" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="bg-primary-light text-primary" style={{ padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
        <FolderSearch size={32} />
      </div>
      <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{title}</h3>
      <p className="text-secondary" style={{ marginBottom: '24px', maxWidth: '400px' }}>{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, message, action }: StateProps) {
  return (
    <div className="card text-center" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderColor: '#fca5a5' }}>
      <div style={{ backgroundColor: '#fee2e2', color: 'var(--critical)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
        <AlertTriangle size={32} />
      </div>
      <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{title}</h3>
      <p className="text-secondary" style={{ marginBottom: '24px', maxWidth: '400px' }}>{message}</p>
      {action}
    </div>
  );
}
