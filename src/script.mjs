/**
 * 智能窗口系统，支持拖动、调整大小、最大化/最小化、吸附等。
 * @class
 */
class Utils {
    static randomGradient() {
        const c1 = `hsl(${Math.random()*360},80%,60%)`;
        const c2 = `hsl(${Math.random()*360},80%,60%)`;
        return `linear-gradient(120deg,${c1},${c2})`;
    }
    static escapeHTML(str) {
        return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    }
}

/**
 * 智能窗口系统，支持拖动、调整大小、最大化/还原、吸附等。
 * @class
 */
class WindowSystem {
    /**
     * 构造函数，初始化事件绑定和状态
     */
    constructor() {
        this.isResizing = false;
        this.isDragging = false;
        this.dragWnd = null;
        this.resizeWnd = null;
        this.snapMargin = parseFloat(getComputedStyle(document.documentElement).fontSize) * 2; // 2lh
        this.snapDirection = null; // 新增：记录吸附方向
        this.previewBox = null;
        this.minimizedWindows = [];
        this.windowListBar = null;
        this.osTaskbar = null;
        this.lh = parseFloat(getComputedStyle(document.documentElement).fontSize); // 1lh
        this.initPointerEvents();
        this.initTouchEvents();
        this.initTheme();
        this.initRandomBg();
        this.initAddWindowBtn();
        this.initWindowListBar();
        this.loadWindowsFromDB(); // 新增：页面加载时恢复窗口
    }

    /**
     * 初始化指针事件
     */
    initPointerEvents() {
        document.addEventListener('pointerdown', e => {
            // 只允许在窗口区域拖动
            if (!e.target.closest('.wnd')) return;
            this.handlePointerStart(e);
        });
        document.addEventListener('dblclick', e => {
            if (!e.target.closest('.wnd-hdr')) return;
            this.handleDoubleClick(e);
        });
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', this.toggleTheme.bind(this));
    }

    /**
     * 初始化触摸事件
     */
    initTouchEvents() {
        document.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            if (!touch) return;
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target || !target.closest('.wnd')) return;
            this.handleTouchStart(e, target.closest('.wnd'));
        }, {passive: false});
    }

    /**
     * 处理触摸开始事件
     * @param {TouchEvent} e
     * @param {HTMLElement} wnd
     */
    handleTouchStart(e, wnd) {
        if (!wnd) return;
        e.preventDefault();
        let startX = e.touches[0].clientX, startY = e.touches[0].clientY;
        const rect = wnd.getBoundingClientRect();
        let offsetX = startX - rect.left, offsetY = startY - rect.top;
        const move = ev => {
            if (!ev.touches || ev.touches.length === 0) return;
            let nx = ev.touches[0].clientX - offsetX;
            let ny = ev.touches[0].clientY - offsetY;
            wnd.style.left = nx + 'px';
            wnd.style.top = ny + 'px';
        };
        const up = () => {
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
        };
        document.addEventListener('touchmove', move, {passive: false});
        document.addEventListener('touchend', up, {passive: false});
    }

    /**
     * 初始化主题
     */
    initTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('light', theme === 'light');
    }

    /**
     * 随机设置body背景渐变色
     */
    initRandomBg() {
        document.body.style.background = Utils.randomGradient();
    }

    /**
     * 主题切换
     */
    toggleTheme() {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    /**
     * 初始化添加窗口按钮
     */
    initAddWindowBtn() {
        if (!document.getElementById('add-window-btn')) {
            const btn = document.createElement('button');
            btn.id = 'add-window-btn';
            btn.textContent = '添加窗口';
            btn.style.position = 'fixed';
            btn.style.top = '10px';
            btn.style.left = '10px';
            btn.style.zIndex = '999';
            btn.onclick = () => {
                this.createWindow();
                this.initRandomBg();
            };
            document.body.appendChild(btn);
        }
    }

    /**
     * 初始化窗口列表栏
     */
    initWindowListBar() {
        // 任务栏结构：左icon，中窗口管理，右系统信息
        if (!document.getElementById('os-taskbar-bar')) {
            const bar = document.createElement('div');
            bar.id = 'os-taskbar-bar';
            bar.style.position = 'fixed';
            bar.style.left = '0';
            bar.style.right = '0';
            bar.style.bottom = '0';
            bar.style.height = '44px';
            bar.style.display = 'flex';
            bar.style.alignItems = 'center';
            bar.style.background = 'rgba(30,30,30,0.95)';
            bar.style.zIndex = '2000';
            // 左icon
            const left = document.createElement('div');
            left.style.flex = '0 0 44px';
            left.style.display = 'flex';
            left.style.justifyContent = 'center';
            left.style.alignItems = 'center';
            // 白色A字+渐变动画
            const aicon = document.createElement('div');
            aicon.className = 'ahou-animated-icon';
            aicon.textContent = 'A';
            left.appendChild(aicon);
            // 中窗口管理
            const center = document.createElement('div');
            center.id = 'window-list-bar';
            center.style.flex = '1 1 auto';
            center.style.display = 'flex';
            center.style.gap = '8px';
            center.style.justifyContent = 'center';
            // 右系统信息
            const right = document.createElement('div');
            right.id = 'os-taskbar';
            right.style.flex = '0 0 auto';
            right.style.display = 'flex';
            right.style.alignItems = 'center';
            right.style.gap = '10px';
            bar.appendChild(left);
            bar.appendChild(center);
            bar.appendChild(right);
            document.body.appendChild(bar);
            this.windowListBar = center;
            this.osTaskbar = right;
            this.initSystemInfo();
            // icon渐变动画
            setInterval(()=>{
                const c1 = `hsl(${Math.random()*360},80%,60%)`;
                const c2 = `hsl(${Math.random()*360},80%,60%)`;
                aicon.style.background = `linear-gradient(120deg,${c1},${c2})`;
            }, 1200);
        } else {
            this.windowListBar = document.getElementById('window-list-bar');
            this.osTaskbar = document.getElementById('os-taskbar');
        }
    }

    /**
     * 更新窗口列表栏
     */
    updateWindowListBar() {
        if (!this.windowListBar) return;
        this.windowListBar.innerHTML = '';
        this.minimizedWindows.forEach((wnd, idx) => {
            const btn = document.createElement('button');
            btn.className = 'taskbar-btn';
            const icon = document.createElement('img');
            icon.src = '/src/favicon.svg';
            icon.alt = 'icon';
            icon.style.width = '20px';
            icon.style.height = '20px';
            icon.style.verticalAlign = 'middle';
            btn.appendChild(icon);
            const name = document.createElement('span');
            name.className = 'taskbar-name';
            name.textContent = wnd.getAttribute('data-title') || `窗口${idx+1}`;
            btn.appendChild(name);
            btn.onclick = () => {
                wnd.classList.remove('minimized');
                wnd.style.display = '';
                this.minimizedWindows = this.minimizedWindows.filter(w => w !== wnd);
                this.updateWindowListBar();
            };
            this.windowListBar.appendChild(btn);
        });
        this.windowListBar.style.display = this.minimizedWindows.length ? 'flex' : 'flex';
    }

    /**
     * 初始化系统信息
     */
    initSystemInfo() {
        if (!this.osTaskbar) return;
        // 时间
        const timeSpan = document.createElement('span');
        timeSpan.style.fontSize = '15px';
        // 帧率
        const fpsSpan = document.createElement('span');
        fpsSpan.style.fontSize = '15px';
        // 内存
        const memSpan = document.createElement('span');
        memSpan.style.fontSize = '15px';
        // 电量
        const batterySpan = document.createElement('span');
        batterySpan.style.fontSize = '15px';
        // CPU核心
        const cpuSpan = document.createElement('span');
        cpuSpan.style.fontSize = '15px';
        this.osTaskbar.append(timeSpan, fpsSpan, memSpan, batterySpan, cpuSpan);
        // 时间与星期
        setInterval(()=>{
            const now = new Date();
            const week = ['日','一','二','三','四','五','六'];
            timeSpan.textContent = now.toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}) + ' 星期' + week[now.getDay()];
        }, 1000);
        // 帧率
        let last = performance.now(), frames = 0;
        function loop(){
            frames++;
            const now = performance.now();
            if (now - last > 1000) {
                fpsSpan.textContent = 'FPS:' + frames;
                frames = 0; last = now;
            }
            requestAnimationFrame(loop);
        } loop();
        // 内存
        if (performance.memory) setInterval(()=>{
            const m = performance.memory;
            memSpan.textContent = `内存:${(m.usedJSHeapSize/1048576).toFixed(1)}MB/${(m.totalJSHeapSize/1048576).toFixed(1)}MB`;
        }, 2000);
        // 电量
        if (navigator.getBattery) navigator.getBattery().then(bat=>{
            function updateBat(){
                batterySpan.textContent = `电量:${Math.round(bat.level*100)}%${bat.charging?'⚡':''}`;
            }
            updateBat();
            bat.addEventListener('levelchange', updateBat);
            bat.addEventListener('chargingchange', updateBat);
        });
        // CPU核心
        if (navigator.hardwareConcurrency) cpuSpan.textContent = `CPU:${navigator.hardwareConcurrency}核`;
    }

    /**
     * 创建新窗口
     */
    createWindow(opts) {
        const wnd = document.createElement('div');
        wnd.className = 'wnd';
        wnd.style.left = Math.round(Math.random()*400+40) + 'px';
        wnd.style.top = Math.round(Math.random()*200+40) + 'px';
        wnd.style.width = '400px';
        wnd.style.height = '300px';
        wnd.setAttribute('data-title', opts?.title || '新窗口');
        wnd.innerHTML = `
        <div class="wnd-hdr">
            <img src="/src/favicon.svg" alt="窗口图标">
            <span>${Utils.escapeHTML(opts?.title || '新窗口')}</span>
            <div class="wnd-ctrls">
                <button class="wnd-ctrl min" title="最小化"></button>
                <button class="wnd-ctrl max" title="最大化"></button>
                <button class="wnd-ctrl cls" title="关闭"></button>
            </div>
        </div>
        <div class="wnd-cnt">${opts?.content || `<h2>新建窗口</h2><p>这是一个新建的窗口。</p>`}</div>
        <div class="rsz n"></div>
        <div class="rsz s"></div>
        <div class="rsz e"></div>
        <div class="rsz w"></div>
        <div class="rsz ne"></div>
        <div class="rsz nw"></div>
        <div class="rsz se"></div>
        <div class="rsz sw"></div>
        `;
        document.body.appendChild(wnd);
        // 窗口列表内容刷新
        if (opts?.title === '窗口列表') {
            setInterval(()=>{
                const list = Array.from(document.querySelectorAll('.wnd')).map(w=>`<li>${w.getAttribute('data-title')}</li>`).join('');
                wnd.querySelector('#win-list-content').innerHTML = `<ul>${list}</ul>`;
            }, 1000);
        }
        this.saveWindowsToDB(); // 新增：每次创建窗口后保存
    }

    /**
     * 指针按下事件处理
     * @param {PointerEvent} e
     */
    handlePointerStart(e) {
        const wnd = e.target.closest('.wnd');
        if (!wnd) return;
        this.bringToFront(wnd);
        if (e.target.closest('.wnd-ctrl')) {
            this.handleControlClick(e.target, wnd);
        } else if (e.target.classList.contains('rsz')) {
            this.startResize(e, wnd, e.target.classList);
        } else if (e.target.closest('.wnd-hdr')) {
            this.startDrag(e, wnd);
        }
    }

    /**
     * 双击标题栏最大化/还原
     * @param {MouseEvent} e
     */
    handleDoubleClick(e) {
        const header = e.target.closest('.wnd-hdr');
        if (header) this.toggleMaximize(header.parentElement);
    }

    /**
     * 键盘快捷键处理
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        const activeWnd = document.querySelector('.wnd:last-of-type');
        if (!activeWnd) return;
        switch (e.key) {
            case 'Escape': activeWnd.remove(); break;
            case 'm': activeWnd.classList.toggle('minimized'); break;
            case 'Enter': this.toggleMaximize(activeWnd); break;
        }
    }

    /**
     * 置顶窗口
     * @param {HTMLElement} wnd
     */
    bringToFront(wnd) { [...document.querySelectorAll('.wnd')].forEach((w,i)=>w.style.zIndex=i+1); wnd.style.zIndex=99; }
    /**
     * 处理窗口控制按钮
     * @param {HTMLElement} ctrl
     * @param {HTMLElement} wnd
     */
    handleControlClick(ctrl, wnd) {
        const act = ctrl.classList[1];
        if (act === 'cls') {
            wnd.remove();
            this.minimizedWindows = this.minimizedWindows.filter(w => w !== wnd);
            this.updateWindowListBar();
            this.saveWindowsToDB(); // 关闭后保存
        }
        if (act === 'min') {
            wnd.classList.add('minimized');
            wnd.style.display = 'none';
            if (!this.minimizedWindows.includes(wnd)) {
                this.minimizedWindows.push(wnd);
                this.updateWindowListBar();
            }
        }
        if (act === 'max') this.toggleMaximize(wnd);
    }

    /**
     * 开始拖动窗口
     * @param {PointerEvent} e
     * @param {HTMLElement} wnd
     */
    startDrag(e, wnd) {
        if (this.isResizing || wnd.classList.contains('maximized')) return;
        this.isDragging = true;
        this.dragWnd = wnd;
        const { left, top, width, height } = wnd.getBoundingClientRect();
        // 拖动前判断宽高
        if (width <= this.lh || height <= this.lh) return;
        const startX = e.clientX, startY = e.clientY;
        const move = ev => {
            if (!this.isDragging) return;
            // 拖动中判断宽高
            const rect = wnd.getBoundingClientRect();
            if (rect.width <= this.lh || rect.height <= this.lh) return;
            let nx = left + ev.clientX - startX;
            let ny = top + ev.clientY - startY;
            const margin = this.snapMargin;
            const sw = window.innerWidth, sh = window.innerHeight;
            let snap = '';
            // 判断吸附区域
            if (ny < margin) snap = 'top';
            else if (ny + height > sh - margin) snap = 'bottom';
            else if (nx < margin) snap = 'left';
            else if (nx + width > sw - margin) snap = 'right';
            this.snapDirection = snap || null;
            // 预览吸附
            if (snap) {
                let l=0,t=0,w=sw,h=sh;
                if (snap==='top') { t=0; l=0; w=sw; h=sh/2; }
                if (snap==='bottom') { t=sh/2; l=0; w=sw; h=sh/2; }
                if (snap==='left') { t=0; l=0; w=sw/2; h=sh; }
                if (snap==='right') { t=0; l=sw/2; w=sw/2; h=sh; }
                this.showSnapPreview(l, t, w, h);
            } else {
                this.hideSnapPreview();
            }
            wnd.style.left = nx + 'px';
            wnd.style.top = ny + 'px';
            // 拖到最上面自动全屏
            if (ny === 0) {
                wnd.classList.add('maximized');
                Object.assign(wnd.style, {
                    left: 0,
                    top: 0,
                    width: '100vw',
                    height: '100vh'
                });
                this.hideSnapPreview();
            } else {
                wnd.classList.remove('maximized');
            }
        };
        const up = () => {
            this.isDragging = false;
            this.dragWnd = null;
            // 吸附时自动调整窗口大小
            if (this.snapDirection) {
                const sw = window.innerWidth, sh = window.innerHeight;
                if (this.snapDirection === 'top') {
                    Object.assign(wnd.style, {left:'0px',top:'0px',width:sw+'px',height:(sh/2)+'px'});
                } else if (this.snapDirection === 'bottom') {
                    Object.assign(wnd.style, {left:'0px',top:(sh/2)+'px',width:sw+'px',height:(sh/2)+'px'});
                } else if (this.snapDirection === 'left') {
                    Object.assign(wnd.style, {left:'0px',top:'0px',width:(sw/2)+'px',height:sh+'px'});
                } else if (this.snapDirection === 'right') {
                    Object.assign(wnd.style, {left:(sw/2)+'px',top:'0px',width:(sw/2)+'px',height:sh+'px'});
                }
                this.snapDirection = null;
            }
            this.hideSnapPreview();
            this.saveWindowsToDB(); // 拖动结束后保存
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }

    /**
     * 吸附并调整窗口大小
     * @param {HTMLElement} wnd
     * @param {string} pos
     */
    snapMax(wnd, pos) {
        wnd.classList.remove('maximized', 'snap-top', 'snap-bottom', 'snap-left', 'snap-right', 'snap-topleft', 'snap-topright', 'snap-bottomleft', 'snap-bottomright');
        wnd.classList.add('snap-' + pos);
        // 通过CSS控制吸附样式
    }

    /**
     * 吸附预览
     */
    showSnapPreview(left, top, width, height) {
        if (!this.previewBox) {
            this.previewBox = document.createElement('div');
            this.previewBox.className = 'preview-box';
            this.previewBox.style.position = 'fixed';
            this.previewBox.style.border = '2px dashed #4af';
            this.previewBox.style.pointerEvents = 'none';
            this.previewBox.style.zIndex = '9999';
            document.body.appendChild(this.previewBox);
        }
        this.previewBox.style.display = 'block';
        this.previewBox.style.left = left + 'px';
        this.previewBox.style.top = top + 'px';
        this.previewBox.style.width = width + 'px';
        this.previewBox.style.height = height + 'px';

    }

    hideSnapPreview() {
        if (this.previewBox) this.previewBox.style.display = 'none';
    }

    /**
 * 开始调整窗口大小
 * @param {PointerEvent} e
 * @param {HTMLElement} wnd
 * @param {DOMTokenList} classes
 */
    startResize(e, wnd, classes) {
        if (this.isResizing) return;
        e.stopPropagation();
        this.isResizing = true;
        this.resizeWnd = wnd;
        
        const rect = wnd.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const startWidth = rect.width, startHeight = rect.height;
        const startLeft = rect.left, startTop = rect.top;
    
        // 预览框
        if (!this.previewBox) {
            this.previewBox = document.createElement('div');
            Object.assign(this.previewBox.style, {
                position: 'fixed',
                border: '2px dashed #4af',
                pointerEvents: 'none',
                zIndex: '9999'
            });
            document.body.appendChild(this.previewBox);
        }
    
        Object.assign(this.previewBox.style, {
            display: 'block',
            left: `${startLeft}px`,
            top: `${startTop}px`,
            width: `${startWidth}px`,
            height: `${startHeight}px`
        });
    
        const move = ev => {
            if (!this.isResizing) return;
            const dx = ev.clientX - startX, dy = ev.clientY - startY;
            let newLeft = startLeft, newTop = startTop;
            let newWidth = startWidth, newHeight = startHeight;
    
            // 处理四个边
            if (classes.contains('e')) newWidth = startWidth + dx;
            if (classes.contains('w')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
            }
            if (classes.contains('s')) newHeight = startHeight + dy;
            if (classes.contains('n')) {
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            }
    
            // 处理四个角落（组合方向）
            if (classes.contains('ne')) {
                newWidth = startWidth + dx;
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            }
            if (classes.contains('nw')) {
                newWidth = startWidth - dx;
                newHeight = startHeight - dy;
                newLeft = startLeft + dx;
                newTop = startTop + dy;
            }
            if (classes.contains('se')) {
                newWidth = startWidth + dx;
                newHeight = startHeight + dy;
            }
            if (classes.contains('sw')) {
                newWidth = startWidth - dx;
                newHeight = startHeight + dy;
                newLeft = startLeft + dx;
            }
    
            // 应用最小尺寸限制
            const minWidth = 180, minHeight = 80;
            if (newWidth < minWidth) {
                if (classes.contains('w') || classes.contains('nw') || classes.contains('sw')) {
                    newLeft = startLeft + startWidth - minWidth;
                }
                newWidth = minWidth;
            }
            if (newHeight < minHeight) {
                if (classes.contains('n') || classes.contains('ne') || classes.contains('nw')) {
                    newTop = startTop + startHeight - minHeight;
                }
                newHeight = minHeight;
            }
    
            Object.assign(this.previewBox.style, {
                left: `${newLeft}px`,
                top: `${newTop}px`,
                width: `${newWidth}px`,
                height: `${newHeight}px`
            });
        };
    
        const up = () => {
            this.isResizing = false;
            // 应用最终尺寸和位置
            Object.assign(wnd.style, {
                left: this.previewBox.style.left,
                top: this.previewBox.style.top,
                width: this.previewBox.style.width,
                height: this.previewBox.style.height
            });
            this.previewBox.style.display = 'none';
            this.saveWindowsToDB(); // 调整大小后保存
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
        };
    
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }

    /**
     * 最大化/还原窗口
     * @param {HTMLElement} wnd
     */
    toggleMaximize(wnd) { wnd.classList.toggle('maximized'); Object.assign(wnd.style, wnd.classList.contains('maximized') ? 
        {left:0,top:0,width:'100vw',height:'100vh'} : {width:'400px',height:'300px'}); }

    /**
     * 创建初始窗口
     */
    createInitialWindows() {
        [
            { 
                title: '赤壁赋', 
                content: '<pre style="font-size:15px;line-height:1.7">壬戌之秋，七月既望...</pre>' 
            },
            { 
                title: 'ys', 
                content: '<iframe src="https://ys.mihoyo.com/" style="width:100%;height:100%;border:none"></iframe>' 
            },
            { 
                title: '666', 
                content: '<iframe src="/index.html" style="width:100%;height:100%;border:none"></iframe>' 
            },
            { 
                title: '窗口列表', 
                content: '<div id="win-list-content"></div>' 
            },
            { 
                title: 'window对象', 
                content: '<ul>'+Object.keys(window).map(k=>`<li>${k}</li>`).join('')+'</ul>'
            }
        ].forEach(w => this.createWindow(w));
    }

    /**
     * IndexedDB 持久化相关
     */
    saveWindowsToDB() {
        const wndData = Array.from(document.querySelectorAll('.wnd')).map((wnd, idx) => ({
            id: idx,
            title: wnd.getAttribute('data-title'),
            html: wnd.querySelector('.wnd-cnt')?.innerHTML,
            left: wnd.style.left,
            top: wnd.style.top,
            width: wnd.style.width,
            height: wnd.style.height,
            minimized: wnd.classList.contains('minimized'),
            maximized: wnd.classList.contains('maximized')
        }));
        const req = indexedDB.open('windowdb', 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('windows')) db.createObjectStore('windows', {keyPath:'id'});
        };
        req.onsuccess = e => {
            const db = e.target.result;
            const tx = db.transaction('windows', 'readwrite');
            const store = tx.objectStore('windows');
            store.clear();
            wndData.forEach(w => store.put(w));
        };
    }

    loadWindowsFromDB() {
        const req = indexedDB.open('windowdb', 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('windows')) db.createObjectStore('windows', {keyPath:'id'});
        };
        req.onsuccess = e => {
            const db = e.target.result;
            const tx = db.transaction('windows', 'readonly');
            const store = tx.objectStore('windows');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
                if (getAll.result && getAll.result.length) {
                    getAll.result.forEach(w => {
                        this.createWindow({
                            title: w.title,
                            content: w.html
                        });
                        const wnd = document.querySelectorAll('.wnd')[w.id];
                        if (wnd) {
                            wnd.style.left = w.left;
                            wnd.style.top = w.top;
                            wnd.style.width = w.width;
                            wnd.style.height = w.height;
                            if (w.minimized) {
                                wnd.classList.add('minimized');
                                wnd.style.display = 'none';
                                if (!this.minimizedWindows.includes(wnd)) this.minimizedWindows.push(wnd);
                            }
                            if (w.maximized) wnd.classList.add('maximized');
                        }
                    });
                    this.updateWindowListBar();
                } else {
                    this.createInitialWindows();
                }
            };
        };
    }
}

new WindowSystem();

