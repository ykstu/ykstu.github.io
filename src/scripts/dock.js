// dock.js - macOS 风格 Dock 动画与交互增强
// 依赖：页面需有 #taskbar 元素

(function(){
    const dock = document.getElementById('taskbar');
    if (!dock) return;

    // 动态放大动画（基于鼠标距离）
    function handleDockMouseMove(e) {
        const buttons = Array.from(dock.querySelectorAll('button'));
        const rect = dock.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        buttons.forEach(btn => {
            const btnRect = btn.getBoundingClientRect();
            const btnCenter = btnRect.left - rect.left + btnRect.width/2;
            const dist = Math.abs(mouseX - btnCenter);
            // 距离越近 scale 越大，最大1.4，最小1
            let scale = 1 + Math.max(0, 1.4 - dist/60);
            if (scale > 1.4) scale = 1.4;
            if (scale < 1) scale = 1;
            btn.style.transform = `translateY(-${(scale-1)*18}px) scale(${scale})`;
            btn.style.zIndex = scale > 1.05 ? 2 : 1;
        });
    }
    function resetDockScale() {
        dock.querySelectorAll('button').forEach(btn => {
            btn.style.transform = '';
            btn.style.zIndex = '';
        });
    }
    dock.addEventListener('mousemove', handleDockMouseMove);
    dock.addEventListener('mouseleave', resetDockScale);

    // 点击动画反馈
    dock.addEventListener('mousedown', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        btn.classList.add('dock-btn-active');
    });
    dock.addEventListener('mouseup', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        btn.classList.remove('dock-btn-active');
    });

    // dock按钮激活样式
    const style = document.createElement('style');
    style.textContent = `
    #taskbar {
        perspective: 600px;
    }
    #taskbar button {
        will-change: transform, box-shadow;
        transition: box-shadow 0.18s, background 0.18s, filter 0.18s, transform 0.18s cubic-bezier(.4,2,.6,1);
    }
    #taskbar button.dock-btn-active {
        box-shadow: 0 8px 32px #2196f3cc, 0 2px 12px #2196f3cc;
        background: #2196f3;
        color: #fff;
        filter: brightness(1.15);
        transition: box-shadow 0.18s, background 0.18s, filter 0.18s;
    }
    #taskbar button.dock-btn-bounce {
        animation: dock-bounce 0.5s cubic-bezier(.28,1.84,.42,.98);
    }
    @keyframes dock-bounce {
        0% { transform: translateY(-10px) scale(1.18); }
        30% { transform: translateY(-30px) scale(1.25); }
        60% { transform: translateY(-12px) scale(1.12); }
        100% { transform: translateY(0) scale(1); }
    }
    `;
    document.head.appendChild(style);

    // 启动时轻微弹跳动画
    setTimeout(() => {
        dock.querySelectorAll('button').forEach((btn, i) => {
            setTimeout(() => {
                btn.classList.add('dock-btn-bounce');
                setTimeout(() => btn.classList.remove('dock-btn-bounce'), 500);
            }, 80 * i);
        });
    }, 300);
})();
