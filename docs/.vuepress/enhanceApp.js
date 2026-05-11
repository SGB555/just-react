const THEME_STORAGE_KEY = 'just-react-theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getStoredTheme () {
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return theme === 'dark' || theme === 'light' ? theme : null
  } catch (error) {
    return null
  }
}

function setStoredTheme (theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {}
}

function applyTheme (theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function notifyThemeChange (theme) {
  window.dispatchEvent(new CustomEvent('color-theme-change', { detail: theme }))
}

function getPreferredTheme () {
  const storedTheme = getStoredTheme()

  if (storedTheme) {
    return storedTheme
  }

  if (window.matchMedia && window.matchMedia(DARK_MEDIA_QUERY).matches) {
    return 'dark'
  }

  return 'light'
}

export default ({ Vue }) => {
  if (typeof window === 'undefined') {
    return
  }

  const mediaQuery = window.matchMedia && window.matchMedia(DARK_MEDIA_QUERY)

  applyTheme(getPreferredTheme())

  if (mediaQuery) {
    const handleSystemThemeChange = event => {
      if (!getStoredTheme()) {
        const theme = event.matches ? 'dark' : 'light'
        applyTheme(theme)
        notifyThemeChange(theme)
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }

  Vue.prototype.$getColorTheme = () => {
    return document.documentElement.getAttribute('data-theme') || getPreferredTheme()
  }

  Vue.prototype.$setColorTheme = theme => {
    if (theme !== 'dark' && theme !== 'light') {
      return
    }

    setStoredTheme(theme)
    applyTheme(theme)
    notifyThemeChange(theme)
  }
}
