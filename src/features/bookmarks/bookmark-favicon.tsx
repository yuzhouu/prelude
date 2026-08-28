import { useState } from 'react'

import { getFaviconUrl } from './chrome-bookmarks'

export function BookmarkFavicon({
  title,
  url,
}: {
  title: string
  url: string
}) {
  const [hasError, setHasError] = useState(false)
  const faviconUrl = getFaviconUrl(url)

  return (
    <span className="bookmark-favicon">
      {faviconUrl && !hasError ? (
        <img
          src={faviconUrl}
          alt=""
          width="20"
          height="20"
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">
          {title.trim().charAt(0).toUpperCase() || '•'}
        </span>
      )}
    </span>
  )
}
