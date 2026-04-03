import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl font-medium text-sm transition-colors disabled:opacity-50'
  const variants = {
    primary: 'bg-gray-900 text-white active:bg-gray-700 dark:bg-white dark:text-gray-900',
    ghost: 'text-gray-700 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-800',
    danger: 'text-red-600 active:bg-red-50 dark:text-red-400 dark:active:bg-red-900/20',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
