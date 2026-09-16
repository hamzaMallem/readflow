interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search documents..."
        className="w-full pl-9 pr-4 h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
      />
    </div>
  )
}
