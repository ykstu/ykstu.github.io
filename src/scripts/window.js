function WindowApp(appEl) {
    let dragging = false;
    let offset = { x: 0, y: 0 };
    let isMaximized = false;
    let lastRect = null;
    let snapPreview = null;
    let snapType = null;
    let headerHeight = 0;
    let snapRect = null;
    let snapped = null;
    let movePreviewBox = null;
    let head = appEl.querySelector('app-head');
    let control = appEl.querySelector('control');

    function getHeaderHeight() {
        if (!headerHeight) {
            const header = document.querySelector('header');
            headerHeight = header ? header.offsetHeight : 0;
        }
        return headerHeight;
    }

    function bringToFront() {
        const maxZ = Math.max(
            ...[...document.querySelectorAll('app')]
                .map(a => parseInt(a.style.zIndex) || 10)
        );
        appEl.style.zIndex = maxZ + 1;
    }

    function setAppStyle(styleObj) {
        const zIndex = appEl.style.zIndex;
        Object.assign(appEl.style, styleObj);
        if (zIndex) appEl.style.zIndex = zIndex;
    }

    function initDrag() {
        if (!head) return;
        const startHandler = (e) => {
            // 支持pointer事件，兼容触摸板
            if (e.type === 'pointerdown' && e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;
            if (e.button !== undefined && e.button !== 0) return;
            if (e.target.closest('.window-context-menu')) return;
            bringToFront();
            onDragStart(e);
        };
        head.addEventListener('mousedown', startHandler);
        head.addEventListener('touchstart', startHandler, { passive: false });
        head.addEventListener('pointerdown', startHandler);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        appEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            bringToFront();
        });
        appEl.addEventListener('touchstart', () => bringToFront());
        appEl.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            bringToFront();
        });
    }

    function initDoubleClick() {
        if (!head) return;
        head.addEventListener('dblclick', (e) => {
            if (control?.contains(e.target)) return;
            toggleMaximize();
        });
    }

    function toggleMaximize() {
        isMaximized ? restore() : maximize();
    }

    function maximize(anim = true) {
        if (isMaximized) return;
        lastRect = {
            left: appEl.offsetLeft,
            top: appEl.offsetTop,
            width: appEl.offsetWidth,
            height: appEl.offsetHeight
        };
        setAppStyle({
            left: '0px',
            top: `${getHeaderHeight()}px`,
            width: '100vw',
            height: `calc(100vh - ${getHeaderHeight()}px)`,
            borderRadius: '0',
            transition: anim ? 'all 0.25s cubic-bezier(.4,2,.6,1)' : ''
        });
        if (head) {
            head.style.zIndex = 'auto';
            head.style.pointerEvents = '';
        }
        isMaximized = true;
        appEl.setAttribute('data-maximized', 'true');
    }

    function restore(anim = true) {
        if (!isMaximized || !lastRect) return;
        setAppStyle({
            left: `${lastRect.left}px`,
            top: `${lastRect.top}px`,
            width: `${lastRect.width}px`,
            height: `${lastRect.height}px`,
            borderRadius: '',
            transition: anim ? 'all 0.25s cubic-bezier(.4,2,.6,1)' : ''
        });
        if (head) {
            head.style.zIndex = '';
            head.style.pointerEvents = '';
        }
        isMaximized = false;
        appEl.removeAttribute('data-maximized');
    }

    function showSnapPreview(type) {
        if (!snapPreview) {
            snapPreview = document.createElement('div');
            snapPreview.className = 'snap-preview';
            Object.assign(snapPreview.style, {
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
                background: 'rgba(33,150,243,0.08)',
                border: '2.5px dashed #2196f3',
                transition: 'all 0.18s cubic-bezier(.4,2,.6,1)'
            });
            document.body.appendChild(snapPreview);
        }
        snapType = type;
        const headerH = getHeaderHeight();
        const style = getSnapStyle(type, headerH);
        Object.assign(snapPreview.style, style, {
            display: 'block',
            opacity: '1'
        });
    }

    function getSnapStyle(type, headerH) {
        const styles = {
            default: { left: '0', top: `${headerH}px`, width: '100vw', height: `calc(100vh - ${headerH}px)` },
            left: { left: '0', top: `${headerH}px`, width: '50vw', height: `calc(100vh - ${headerH}px)` },
            right: { left: '50vw', top: `${headerH}px`, width: '50vw', height: `calc(100vh - ${headerH}px)` },
            bottomleft: { left: '0', top: `calc(${headerH}px + 50vh)`, width: '50vw', height: '50vh' },
            bottomright: { left: '50vw', top: `calc(${headerH}px + 50vh)`, width: '50vw', height: '50vh' }
        };
        return styles[type] || styles.default;
    }

    function hideSnapPreview() {
        if (snapPreview) {
            snapPreview.style.opacity = '0';
            setTimeout(() => {
                snapPreview && (snapPreview.style.display = 'none');
            }, 180);
        }
        snapType = null;
    }

    function onDragStart(e) {
        if (window.resizeActive) return;
        if (control?.contains(e.target)) return;
        e.preventDefault();
        const evt = e.touches?.[0] || e;
        const rect = appEl.getBoundingClientRect();
        dragging = true;
        offset = {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
        appEl.style.transition = 'none';
        appEl.style.position = 'absolute';
        bringToFront();
        startDragRect = {
            width: appEl.offsetWidth,
            height: appEl.offsetHeight
        };
        if (isMaximized && lastRect) {
            restore(false);
        } else if (snapped && snapRect) {
            setAppStyle({
                left: `${snapRect.left}px`,
                top: `${snapRect.top}px`,
                width: `${snapRect.width}px`,
                height: `${snapRect.height}px`,
                transition: 'all 0.25s cubic-bezier(.4,2,.6,1)'
            });
            snapped = null;
        }
    }

    let startDragRect = null;
    function onDragMove(e) {
        if (window.resizeActive) return;
        if (!dragging) return;
        const IS_PROCESS = window.IS_PROCESS === true;
        const evt = e.touches?.[0] || e;
        const headerH = getHeaderHeight();
        const lh = parseFloat(getComputedStyle(document.documentElement).lineHeight) || 24;
        const config = window.__APP_CONST__ || {};
        if (
            evt.clientX < 0 || evt.clientX > window.innerWidth ||
            evt.clientY < headerH || evt.clientY > window.innerHeight
        ) {
            hideSnapPreview();
            return;
        }
        let x = evt.clientX - offset.x;
        let y = evt.clientY - offset.y;
        if (y < headerH) y = headerH;
        const snap = detectSnapPosition(evt, headerH, lh);
        if (snap) showSnapPreview(snap); else hideSnapPreview();
        if (IS_PROCESS) {
            if (!movePreviewBox) {
                movePreviewBox = document.createElement('div');
                movePreviewBox.className = 'move-preview-box';
                Object.assign(movePreviewBox.style, {
                    position: 'fixed',
                    border: '2px dashed #2196f3',
                    background: 'rgba(33,150,243,0.08)',
                    zIndex: 99998,
                    pointerEvents: 'none',
                    transition: 'all 0.15s cubic-bezier(.4,2,.6,1)',
                });
                document.body.appendChild(movePreviewBox);
            }
            Object.assign(movePreviewBox.style, {
                left: x + 'px',
                top: y + 'px',
                width: startDragRect.width + 'px',
                height: startDragRect.height + 'px',
                display: 'block',
                opacity: '1'
            });
        } else {
            setAppStyle({
                left: `${x}px`,
                top: `${y}px`,
                width: `${startDragRect.width}px`,
                height: `${startDragRect.height}px`
            });
        }
    }

    function detectSnapPosition(evt, headerH, lh) {
        if (window.innerHeight - evt.clientY < lh) {
            if (evt.clientX < lh) return 'bottomleft';
            if (evt.clientX > window.innerWidth - lh) return 'bottomright';
            return 'bottom';
        }
        if (evt.clientX < lh) return 'left';
        if (window.innerWidth - evt.clientX < lh) return 'right';
        return null;
    }

    function onDragEnd(e) {
        if (window.resizeActive) return;
        if (!dragging) return;
        const IS_PROCESS = window.IS_PROCESS === true;
        dragging = false;
        appEl.style.transition = '';
        const evt = e.changedTouches?.[0] || e;
        const snap = detectSnapPosition(evt, getHeaderHeight(), parseFloat(getComputedStyle(document.documentElement).lineHeight) || 24);
        if (snap) snapTo(snap); else hideSnapPreview();
        if (IS_PROCESS && movePreviewBox) {
            let left = parseInt(movePreviewBox.style.left);
            let top = parseInt(movePreviewBox.style.top);
            if (top < getHeaderHeight()) top = getHeaderHeight();
            setAppStyle({
                left: left + 'px',
                top: top + 'px',
                width: movePreviewBox.style.width,
                height: movePreviewBox.style.height
            });
            movePreviewBox.style.display = 'none';
        }
    }

    function snapTo(type) {
        const headerH = getHeaderHeight();
        if (!snapRect) {
            const rect = appEl.getBoundingClientRect();
            snapRect = {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            };
        }
        isMaximized = false;
        setAppStyle(getSnapStyle(type, headerH));
        snapped = type;
    }

    function initControls() {
        if (!control) return;
        const minBtn = control.querySelector('min');
        const maxBtn = control.querySelector('max');
        const exitBtn = control.querySelector('exit');
        if (minBtn) minBtn.onclick = () => minimize();
        if (maxBtn) maxBtn.onclick = () => toggleMaximize();
        if (exitBtn) exitBtn.onclick = () => close();
    }

    function minimize() {
        appEl.style.transition = 'all 0.25s cubic-bezier(.4,2,.6,1), opacity 0.18s';
        appEl.style.opacity = '0';
        setTimeout(() => {
            appEl.style.display = 'none';
            appEl.style.opacity = '1';
        }, 180);
    }

    function close() {
        appEl.style.transition = 'opacity 0.25s cubic-bezier(.4,2,.6,1)';
        appEl.style.opacity = '0';
        setTimeout(() => appEl.remove(), 250);
    }

    function initContextMenu() {
        if (!head) return;
        head.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY);
        });
    }

    function showContextMenu(x, y) {
        document.querySelectorAll('.window-context-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'window-context-menu';
        menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:99999;background:#fff;border:1px solid #2196f3;border-radius:8px;box-shadow:0 4px 16px #0002;min-width:120px;overflow:hidden;`;
        menu.innerHTML = `
            <div class="menu-item" data-act="restore">还原</div>
            <div class="menu-item" data-act="move">移动</div>
            <div class="menu-item" data-act="min">最小化</div>
            <div class="menu-item" data-act="max">${isMaximized ? '还原' : '最大化'}</div>
            <div class="menu-item" data-act="close" style="color:#e53935;">关闭</div>
        `;
        menu.onclick = (ev) => {
            const act = ev.target.dataset.act;
            if (!act) return;
            if (act === 'restore') restore();
            if (act === 'move') {/* 可实现拖动模式 */}
            if (act === 'min') minimize();
            if (act === 'max') toggleMaximize();
            if (act === 'close') close();
            menu.remove();
        };
        document.body.appendChild(menu);
        setTimeout(() => {
            const closeMenu = (ev) => {
                if (!menu.contains(ev.target)) {
                    menu.remove();
                    document.removeEventListener('mousedown', closeMenu);
                }
            };
            document.addEventListener('mousedown', closeMenu);
        }, 10);
    }

    // 初始化
    initDrag();
    initDoubleClick();
    initControls();
    initContextMenu();

    // 挂载到app元素，便于外部调用
    appEl.WindowAppInstance = {
        bringToFront,
        maximize,
        restore,
        minimize,
        close,
        toggleMaximize
    };
}

// Initialize all app windows
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('app').forEach(appEl => {
        WindowApp(appEl);
    });
});

// 保证后续动态创建的app也能自动挂载WindowApp和事件
window.attachAppEvents = function(app) {
    if (typeof WindowApp === 'function' && !app.WindowAppInstance) {
        WindowApp(app);
    }
    app.dispatchEvent(new CustomEvent('created', { detail: { app } }));
};

window.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    if (main && window.MutationObserver) {
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(node => {
                    if (node.tagName === 'APP') {
                        window.attachAppEvents(node);
                    }
                });
            }
        });
        observer.observe(main, { childList: true });
    }
    document.querySelectorAll('app').forEach(appEl => {
        window.attachAppEvents(appEl);
    });
});
