import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  icon,
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const disabledClass = disabled ? 'disabled' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
};

export default Button; 