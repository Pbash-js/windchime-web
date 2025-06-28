import { cn } from "@/lib/utils"

interface GalleryViewProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  emptyState: React.ReactNode
  className?: string
  isFullScreen?: boolean
}

export function GalleryView<T>({
  items,
  renderItem,
  emptyState,
  className,
  isFullScreen = false,
}: GalleryViewProps<T>) {
  if (items.length === 0) {
    return <div className="flex-1 flex items-center justify-center w-full">{emptyState}</div>
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div
        className={cn(
          "grid gap-4 p-4 overflow-y-auto h-full w-full",
          isFullScreen
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
        style={{
          gridAutoRows: isFullScreen ? 'minmax(200px, 1fr)' : 'minmax(150px, 200px)',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-lg rounded-lg overflow-hidden",
              "flex flex-col h-full",
              "bg-gray-800/50 backdrop-blur-sm",
              isFullScreen ? "min-h-[200px]" : "min-h-[150px]"
            )}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  )
}
