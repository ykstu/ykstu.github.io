(function() {
    // 全局配置通过 window.__APP_CONFIG__ 注入
    const config = window.__APP_CONFIG__ || {};
    const MIN_WIDTH = config.MIN_WIDTH || 250;
    const MIN_HEIGHT = config.MIN_HEIGHT || 100;
    const EDGE_SIZE = config.EDGE_SIZE || 10;
    const IS_PROCESS = config.IS_PROCESS !== undefined ? config.IS_PROCESS : true;

    let resizing = null, start = {}, previewBox = null;

    // 获取调整方向
    function getDirection(e, el) {
        if (e.target && /^r[nswe]{1,2}$/.test(e.target.tagName.toLowerCase())) {
            return e.target.tagName.toLowerCase().substring(1);
        }
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let dir = '';
        if (y < EDGE_SIZE) dir += 'n';
        else if (y > rect.height - EDGE_SIZE) dir += 's';
        if (x < EDGE_SIZE) dir += 'w';
        else if (x > rect.width - EDGE_SIZE) dir += 'e';
        return dir;
    }

    // 设置光标样式
    function setCursor(app, dir) {
        app.style.cursor = dir ? `${dir}-resize` : '';
    }

    // 显示调整预览框
    function showPreview(left, top, width, height) {
        if (!previewBox) {
            previewBox = document.createElement('div');
            previewBox.className = 'resize-preview-box';
            document.body.appendChild(previewBox);
        }
        previewBox.style.cssText = `
            left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;
            position: fixed; border: 2px dashed #2196f3; background: rgba(33,150,243,0.08);
            z-index: 99999; pointer-events: none; transition: all 0.15s ease-out; display: block; opacity: 1
        `;
    }

    // 隐藏调整预览框
    function hidePreview() {
        if (previewBox) {
            previewBox.style.opacity = '0';
            setTimeout(() => {
                previewBox.style.display = 'none';
            }, 150);
        }
    }

    // 计算新的尺寸
    function calculateNewSize(dir, dx, dy) {
        let { left, top, width, height } = start;
        if (dir.includes('e')) {
            width = Math.max(MIN_WIDTH, Math.min(start.width + dx, window.innerWidth - left));
        }
        if (dir.includes('w')) {
            let nw = Math.max(MIN_WIDTH, start.width - dx);
            let nl = start.left + dx;
            if (nw === MIN_WIDTH) nl = start.left + start.width - MIN_WIDTH;
            if (nl < 0) {
                nw += nl;
                nl = 0;
            }
            width = nw;
            left = nl;
        }
        if (dir.includes('s')) {
            height = Math.max(MIN_HEIGHT, Math.min(start.height + dy, window.innerHeight - top));
        }
        if (dir.includes('n')) {
            let nh = Math.max(MIN_HEIGHT, start.height - dy);
            let nt = start.top + dy;
            if (nh === MIN_HEIGHT) nt = start.top + start.height - MIN_HEIGHT;
            if (nt < 0) {
                nh += nt;
                nt = 0;
            }
            height = nh;
            top = nt;
        }
        return { left, top, width, height };
    }

    // 应用新的尺寸
    function applyNewSize(app, left, top, width, height) {
        app.classList.add('resizing-move');
        app.style.width = width + 'px';
        app.style.height = height + 'px';
        app.style.left = (left - window.scrollX) + 'px';
        app.style.top = (top - window.scrollY) + 'px';
        if (typeof app.onResize === 'function') {
            app.onResize({ dir: resizing?.dir, left, top, width, height });
        }
    }

    // 注册事件
    document.addEventListener('mousemove', (e) => {
        const app = e.target.closest('app');
        if (!app) return;
        const dir = getDirection(e, app);
        setCursor(app, dir);
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const app = e.target.closest('app');
        if (!app) return;
        const dir = getDirection(e, app);
        if (!dir) return;
        resizing = { app, dir };
        const rect = app.getBoundingClientRect();
        start = {
            x: e.clientX,
            y: e.clientY,
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!resizing) return;
        const { app, dir } = resizing;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        let { left, top, width, height } = calculateNewSize(dir, dx, dy);
        if (width < MIN_WIDTH) width = MIN_WIDTH;
        if (height < MIN_HEIGHT) height = MIN_HEIGHT;
        if (IS_PROCESS) {
            showPreview(left, top, width, height);
        } else {
            applyNewSize(app, left, top, width, height);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!resizing) return;
        const { app, dir } = resizing;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        let { left, top, width, height } = calculateNewSize(dir, dx, dy);
        if (width < MIN_WIDTH) width = MIN_WIDTH;
        if (height < MIN_HEIGHT) height = MIN_HEIGHT;
        if (IS_PROCESS) {
            hidePreview();
        }
        applyNewSize(app, left, top, width, height);
        app.classList.remove('resizing-move');
        app.style.transition = '';
        document.body.style.userSelect = '';
        resizing = null;
    });

    // 注入全局样式
    if (!document.querySelector('style[data-global-resize]')) {
        const style = document.createElement('style');
        style.setAttribute('data-global-resize', 'true');
        style.textContent = `
            .resize-preview-box {
                pointer-events: none;
                box-sizing: border-box;
                position: fixed;
                z-index: 99999;
            }
            app.resizing-move {
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 导出为模块
    if (typeof window !== 'undefined') {
        window.ResizeModule = {
            getDirection,
            setCursor,
            showPreview,
            hidePreview,
            calculateNewSize,
            applyNewSize
        };
    }
})();