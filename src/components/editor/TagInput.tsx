interface TagInputProps {
  value: string
  onChange: (v: string) => void
}

export function TagInput({ value, onChange }: TagInputProps) {
  const tags = value.split(',').map((t) => t.trim()).filter(Boolean)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Tags <span className="font-normal text-gray-400">(comma-separated)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. podcast, economics, lex fridman"
        className="w-full h-11 px-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
      />
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
