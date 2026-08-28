interface ChromeApi {
  search?: {
    query: (queryInfo: {
      disposition?: 'CURRENT_TAB' | 'NEW_TAB' | 'NEW_WINDOW'
      text: string
    }) => Promise<void>
  }
}

function getChromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
}

export function searchWithDefaultProvider(text: string) {
  const searchApi = getChromeApi()?.search
  if (searchApi) {
    void searchApi.query({ disposition: 'CURRENT_TAB', text })
    return
  }

  window.location.assign(
    `https://www.google.com/search?q=${encodeURIComponent(text)}`,
  )
}
