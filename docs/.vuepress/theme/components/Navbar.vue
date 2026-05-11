<template>
  <header class="navbar">
    <SidebarButton @toggle-sidebar="$emit('toggle-sidebar')" />

    <RouterLink
      :to="$localePath"
      class="home-link"
    >
      <img
        v-if="$site.themeConfig.logo"
        class="logo"
        :src="$withBase($site.themeConfig.logo)"
        :alt="$siteTitle"
      >
      <span
        v-if="$siteTitle"
        ref="siteName"
        class="site-name"
        :class="{ 'can-hide': $site.themeConfig.logo }"
      >{{ $siteTitle }}</span>
    </RouterLink>

    <div
      class="links"
      :style="linksWrapMaxWidth ? {
        'max-width': linksWrapMaxWidth + 'px'
      } : {}"
    >
      <AlgoliaSearchBox
        v-if="isAlgoliaSearch"
        :options="algolia"
      />
      <SearchBox v-else-if="$site.themeConfig.search !== false && $page.frontmatter.search !== false" />
      <button
        class="sidebar-toggle-desktop"
        type="button"
        :aria-label="sidebarToggleLabel"
        :title="sidebarToggleLabel"
        @click="toggleDesktopSidebar"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <button
        class="theme-toggle"
        type="button"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="toggleTheme"
      >
        <span aria-hidden="true">{{ themeIcon }}</span>
      </button>
      <NavLinks class="can-hide" />
    </div>
  </header>
</template>

<script>
import AlgoliaSearchBox from '@AlgoliaSearchBox'
import SearchBox from '@SearchBox'
import SidebarButton from '@theme/components/SidebarButton.vue'
import NavLinks from '@theme/components/NavLinks.vue'

export default {
  name: 'Navbar',

  components: {
    SidebarButton,
    NavLinks,
    SearchBox,
    AlgoliaSearchBox
  },

  data () {
    return {
      colorTheme: 'light',
      isSidebarCollapsed: false,
      linksWrapMaxWidth: null
    }
  },

  computed: {
    algolia () {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {}
    },

    isAlgoliaSearch () {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName
    },

    themeIcon () {
      return this.colorTheme === 'dark' ? '☀' : '☾'
    },

    themeToggleLabel () {
      return this.colorTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'
    },

    sidebarToggleLabel () {
      return this.isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'
    }
  },

  mounted () {
    this.syncTheme()
    this.syncSidebarState()
    window.addEventListener('color-theme-change', this.handleThemeChange)
    window.addEventListener('resize', this.handleViewportChange, false)

    const MOBILE_DESKTOP_BREAKPOINT = 768 // refer to .vuepress/styles/palette.styl
    const NAVBAR_VERTICAL_PADDING = parseInt(css(this.$el, 'paddingLeft')) + parseInt(css(this.$el, 'paddingRight'))
    this.handleLinksWrapWidth = () => {
      if (document.documentElement.clientWidth < MOBILE_DESKTOP_BREAKPOINT) {
        this.linksWrapMaxWidth = null
      } else {
        this.linksWrapMaxWidth = this.$el.offsetWidth - NAVBAR_VERTICAL_PADDING
          - (this.$refs.siteName && this.$refs.siteName.offsetWidth || 0)
      }
    }
    this.handleLinksWrapWidth()
    window.addEventListener('resize', this.handleLinksWrapWidth, false)
  },

  beforeDestroy () {
    window.removeEventListener('color-theme-change', this.handleThemeChange)
    window.removeEventListener('resize', this.handleViewportChange, false)

    if (this.handleLinksWrapWidth) {
      window.removeEventListener('resize', this.handleLinksWrapWidth, false)
    }
  },

  methods: {
    syncTheme () {
      if (this.$getColorTheme) {
        this.colorTheme = this.$getColorTheme()
      }
    },

    handleThemeChange (event) {
      this.colorTheme = event.detail
    },

    syncSidebarState () {
      const root = document.documentElement
      const stored = window.localStorage.getItem('just-react-sidebar-collapsed')

      if (stored === '1' && window.innerWidth > 768) {
        root.classList.add('jr-sidebar-collapsed')
      } else if (window.innerWidth <= 768) {
        root.classList.remove('jr-sidebar-collapsed')
      }

      this.isSidebarCollapsed = root.classList.contains('jr-sidebar-collapsed')
    },

    handleViewportChange () {
      if (window.innerWidth <= 768) {
        document.documentElement.classList.remove('jr-sidebar-collapsed')
      }
      this.isSidebarCollapsed = document.documentElement.classList.contains('jr-sidebar-collapsed')
    },

    toggleDesktopSidebar () {
      const root = document.documentElement
      const isCollapsed = root.classList.toggle('jr-sidebar-collapsed')
      window.localStorage.setItem('just-react-sidebar-collapsed', isCollapsed ? '1' : '0')
      this.isSidebarCollapsed = isCollapsed
    },

    toggleTheme () {
      const nextTheme = this.colorTheme === 'dark' ? 'light' : 'dark'

      if (this.$setColorTheme) {
        this.$setColorTheme(nextTheme)
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme)
        this.colorTheme = nextTheme
      }
    }
  }
}

function css (el, property) {
  // NOTE: Known bug, will return 'auto' if style value is 'auto'
  const win = el.ownerDocument.defaultView
  // null means not to return pseudo styles
  return win.getComputedStyle(el, null)[property]
}
</script>

<style lang="stylus">
$navbar-vertical-padding = 0.7rem
$navbar-horizontal-padding = 1.5rem

.navbar
  padding $navbar-vertical-padding $navbar-horizontal-padding
  line-height $navbarHeight - 1.4rem
  a, span, img
    display inline-block
  .logo
    height $navbarHeight - 1.4rem
    min-width $navbarHeight - 1.4rem
    margin-right 0.8rem
    vertical-align top
  .site-name
    font-size 1.3rem
    font-weight 600
    color var(--jr-text)
    position relative
  .links
    padding-left 1.5rem
    box-sizing border-box
    background-color var(--jr-surface)
    white-space nowrap
    font-size 0.9rem
    position absolute
    right $navbar-horizontal-padding
    top $navbar-vertical-padding
    display flex
    align-items center
    .search-box
      flex: 0 0 auto
      vertical-align top
  .theme-toggle
  .sidebar-toggle-desktop
    display inline-flex
    align-items center
    justify-content center
    flex 0 0 auto
    width 2rem
    height 2rem
    margin-right 1rem
    border 1px solid var(--jr-border)
    border-radius 999px
    color var(--jr-text)
    background var(--jr-soft-bg)
    font inherit
    line-height 1
    cursor pointer
    transition background-color .2s ease, border-color .2s ease, color .2s ease
    &:hover
      color var(--jr-accent)
      border-color var(--jr-accent)
    span
      font-size 1rem
  .sidebar-toggle-desktop
    margin-right .5rem

@media (max-width: $MQMobile)
  .navbar
    padding-left 4rem
    .can-hide
      display none
    .links
      padding-left 1.5rem
    .theme-toggle
      margin-right 0
    .sidebar-toggle-desktop
      display none
    .site-name
      width calc(100vw - 9.4rem)
      overflow hidden
      white-space nowrap
      text-overflow ellipsis

@media (min-width: ($MQMobile + 1px))
  .navbar
    .sidebar-toggle-desktop
      display inline-flex
</style>
