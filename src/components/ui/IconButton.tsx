import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({ label, children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`flex items-center justify-center w-11 h-11 rounded-xl text-gray-700 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-800 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
