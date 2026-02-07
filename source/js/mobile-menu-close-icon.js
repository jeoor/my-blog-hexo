(() => {
    const mobileQuery = '(max-width: 768px)'
    const mobileMql = window.matchMedia(mobileQuery)

    let sidebarEl = null
    let sidebarObserver = null
    let buttonEl = null
    let optimisticHideTimer = 0

    const bindOnce = (el, datasetKey, type, handler, options) => {
        if (!el) return
        if (el.dataset && el.dataset[datasetKey]) return
        if (el.dataset) el.dataset[datasetKey] = '1'
        el.addEventListener(type, handler, options)
    }

    const disconnectObserver = () => {
        if (!sidebarObserver) return
        sidebarObserver.disconnect()
        sidebarObserver = null
    }

    const connectObserver = () => {
        if (sidebarObserver) return
        if (!mobileMql.matches) return
        if (!sidebarEl) return

        sidebarObserver = new MutationObserver(() => {
            if (!mobileMql.matches || !sidebarEl) {
                setVisible(false)
                disconnectObserver()
                return
            }

            const isOpen = sidebarEl.classList && sidebarEl.classList.contains('open')
            setVisible(!!isOpen)
            if (!isOpen) disconnectObserver()
        })
        sidebarObserver.observe(sidebarEl, { attributes: true, attributeFilter: ['class'] })
    }

    const ensureButton = () => {
        if (buttonEl && document.body.contains(buttonEl)) return buttonEl

        const existing = document.getElementById('mobile-sidebar-toggle')
        buttonEl = existing || document.createElement('button')
        buttonEl.id = 'mobile-sidebar-toggle'
        buttonEl.type = 'button'
        buttonEl.setAttribute('aria-label', '关闭菜单')

        // Inline fallback styles to avoid relying on CSS load order.
        buttonEl.style.position = 'fixed'
        buttonEl.style.top = '8px'
        buttonEl.style.right = '16px'
        buttonEl.style.width = '44px'
        buttonEl.style.height = '44px'
        buttonEl.style.padding = '0'
        buttonEl.style.border = '0'
        buttonEl.style.borderRadius = '0'
        buttonEl.style.background = 'transparent'
        buttonEl.style.boxShadow = 'none'
        buttonEl.style.outline = 'none'
        buttonEl.style.fontSize = '1.3em'
        buttonEl.style.webkitTapHighlightColor = 'transparent'
        buttonEl.style.webkitAppearance = 'none'
        buttonEl.style.appearance = 'none'
        buttonEl.style.zIndex = '110'
        buttonEl.style.display = 'none'

        // Match theme icon style (FontAwesome). If the icon font fails, CSS still keeps the button clickable.
        buttonEl.innerHTML = '<span class="icon" aria-hidden="true"><i class="fas fa-xmark fa-fw"></i></span>'

        if (!existing) document.body.appendChild(buttonEl)

        if (!buttonEl.dataset.bound) {
            buttonEl.dataset.bound = '1'
            buttonEl.addEventListener('click', event => {
                event.preventDefault()
                const $menuMask = document.getElementById('menu-mask')
                $menuMask && $menuMask.click()
            })
        }

        return buttonEl
    }

    const setVisible = visible => {
        if (!mobileMql.matches) visible = false

        if (!visible) {
            if (optimisticHideTimer) {
                window.clearTimeout(optimisticHideTimer)
                optimisticHideTimer = 0
            }
            if (buttonEl) {
                buttonEl.classList.remove('is-open')
                buttonEl.style.display = 'none'
            }
            return
        }

        const btn = ensureButton()
        btn.style.display = ''
        btn.classList.add('is-open')
    }

    const refresh = () => {
        if (!mobileMql.matches) {
            setVisible(false)
            disconnectObserver()
            return
        }

        if (!sidebarEl || !sidebarEl.classList) {
            setVisible(false)
            return
        }

        const isOpen = sidebarEl.classList.contains('open')
        setVisible(isOpen)
        if (!isOpen) disconnectObserver()
    }

    const optimisticShow = () => {
        if (!mobileMql.matches) return
        connectObserver()
        setVisible(true)

        // If for some reason the sidebar didn't open, hide after ~0.3s.
        if (optimisticHideTimer) window.clearTimeout(optimisticHideTimer)
        optimisticHideTimer = window.setTimeout(refresh, 300)
    }

    const init = () => {
        const nextSidebarEl = document.getElementById('sidebar-menus')
        if (sidebarEl !== nextSidebarEl) {
            disconnectObserver()
            sidebarEl = nextSidebarEl
        }

        const $menuMask = document.getElementById('menu-mask')
        bindOnce($menuMask, 'mobileSidebarCloseMaskBound', 'click', () => {
            setVisible(false)
            disconnectObserver()
        })

        const $toggleMenu = document.getElementById('toggle-menu')
        // Capture: run before theme's open() handler so the icon can appear earlier.
        bindOnce($toggleMenu, 'mobileSidebarCloseToggleBound', 'click', optimisticShow, true)

        if (!sidebarEl) {
            setVisible(false)
            disconnectObserver()
            return
        }

        // Only observe while sidebar is (or is about to be) open.
        if (mobileMql.matches && sidebarEl.classList.contains('open')) connectObserver()
        else disconnectObserver()

        refresh()
    }

    const onMediaChange = () => init()
    if (typeof mobileMql.addEventListener === 'function') mobileMql.addEventListener('change', onMediaChange)
    else if (typeof mobileMql.addListener === 'function') mobileMql.addListener(onMediaChange)

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
    else init()
    document.addEventListener('pjax:complete', init)
})()
