import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  hotkey?: string;
  variant?: 'primary' | 'ghost';
}

export function TerminalButton({
  children,
  hotkey,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: TerminalButtonProps) {
  return (
    <button
      type={type}
      className={`tui-btn tui-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {hotkey ? <span className="tui-fn__key">{hotkey}</span> : null}
      <span className="tui-fn__label">{children}</span>
    </button>
  );
}
