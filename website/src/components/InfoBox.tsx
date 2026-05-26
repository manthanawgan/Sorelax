interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning';
}

export default function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  const borderColor = variant === 'info' ? 'border-accent/30' : 'border-yellow-500/30';
  const bgColor = variant === 'info' ? 'bg-accent/5' : 'bg-yellow-500/5';

  return (
    <div className={`rounded-card border ${borderColor} ${bgColor} p-4 text-sm text-text-secondary`}>
      {children}
    </div>
  );
}
