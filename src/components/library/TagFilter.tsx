interface TagFilterProps {
  tags: string[]
  activeTag: string | null
  onSelect: (tag: string | null) => void
}

export function TagFilter({ tags, activeTag, onSelect }: TagFilterProps) {
  if (tags.length === 0) return null
  return (
    <div className="library-filters scrollbar-none" role="group" aria-label="Filter by tag">
      <button
        onClick={() => onSelect(null)}
        className="library-filter" aria-pressed={activeTag === null}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(activeTag === tag ? null : tag)}
          className="library-filter" aria-pressed={activeTag === tag}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
