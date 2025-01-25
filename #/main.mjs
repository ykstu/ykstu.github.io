/*
 *   /#/main.mjs
 *   @ykstu
 *   2025.1.4
 */

/*
(() => {
    function block() {
        if (
            window.outerHeight - window.innerHeight > 200 ||
            window.outerWidth - window.innerWidth > 200
        ) {
            document.documentElement.innerHTML = '';
        }
        setInterval(() => {
            (function () {
                return false;
            })
                ["constructor"]("debugger")
                ["call"]();
        }, 50);
    }
    try {
        block();
    } catch (err) {}
})();
*/













let napp = 20
let navDiv, newDiv
for (let sapp = 1; sapp < napp + 1; sapp++) {

    newDiv = document.createElement('div');
    newDiv.className = 'app';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';


    //newDiv.style.display = "none"
    navDiv = document.createElement('div');
    navDiv.className = "nav"
    newDiv.appendChild(navDiv);
    const img = document.createElement('img');
    img.className = 'app-img';
    img.alt = '';
    img.src = '#/assets/icon.jpg';

    const appTit = document.createElement('div');
    appTit.className = 'app-tit';
    appTit.textContent = 'Ahou';

    const appTab = document.createElement('div');
    appTab.className = 'app-tab';

    const closeSpan = document.createElement('span');
    closeSpan.className = 'close';

    const minSpan = document.createElement('span');
    minSpan.className = 'min';

    const maxSpan = document.createElement('span');
    maxSpan.className = 'max';

    navDiv.appendChild(img);
    navDiv.appendChild(appTit);
    navDiv.appendChild(appTab);
    appTab.appendChild(closeSpan);
    appTab.appendChild(minSpan);
    appTab.appendChild(maxSpan);
    newDiv.appendChild(contentDiv);
    document.getElementById('apps').appendChild(newDiv);

}
document.getElementById('apps').appendChild(document.createElement('i'));


const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode: function(node) {
        return node.tagName === 'DIV' && node.classList.contains('app') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
}, false);

const divsInCreationOrder = [];
let div;
while ((div = treeWalker.nextNode())) {
    divsInCreationOrder.push(div);
}

divsInCreationOrder.forEach(function(div, index) {
    div.innerHTML = div.innerHTML + (index + 1);
});










document.querySelectorAll('.app').forEach(app => {
    let position, maxed, i;
    app.querySelector('.nav').addEventListener('mousedown', (e) => {
        position = [app.getBoundingClientRect().left - e.clientX, app.getBoundingClientRect().top - e.clientY];
        moveAppFirst(app)
        const onMouseMove = (e) => {
            Object.assign(app.style, {
                left: `${position[0] + e.clientX}px`,
                top: `${position[1] + e.clientY}px`
            });
        }
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    app.querySelector('.nav').addEventListener('touchstart', (e) => {
        position = [parseFloat(window.getComputedStyle(app).left, 10) - e.touches[0].clientX, parseFloat(window.getComputedStyle(app).top, 10) - e.touches[0].clientY];
    });
    app.querySelector('.nav').addEventListener('touchmove', (e) => {
        if (e.touches[0].clientX < 0 || e.touches[0].clientX > window.innerWidth || e.touches[0].clientY < 0 || e.touches[0].clientY > window.innerHeight) {

        } else {
            Object.assign(app.style, {
                left: `${position[0] + e.touches[0].clientX}px`,
                top: `${position[1] + e.touches[0].clientY}px`
            });
        }
    });
    app.querySelector('.nav').addEventListener('touchend', (e) => {

    });
    app.querySelector('.max').addEventListener('click', () => {
        if (maxed) {
            Object.assign(app.style, {
                width: i[0],
                height: i[1],
                top: i[2],
                left: i[3]
            });
            maxed = false
        } else {
            i = [app.style.width, app.style.height, app.style.top, app.style.left]
            Object.assign(app.style, {
                width: "100%",
                height: "100%",
                top: "0",
                left: "0"
            });
            maxed = true
        }
    });
    app.querySelector('.min').addEventListener('click', () => {
        app.style.display = "none"
    });
    app.querySelector('.close').addEventListener('click', () => {
        app.remove()
    });
});


function moveAppLast(divId) {
    document.getElementById("apps").insertBefore(divId, document.getElementById("apps").firstChild);
    return divId
}

function moveAppFirst(divId) {
    document.getElementById("apps").insertBefore(divId, document.getElementById("apps").lastChild);
    return divId
}


function time() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const h = addzero(today.getHours());
    const min = addzero(today.getMinutes());
    const s = addzero(today.getSeconds());
    const ms = today.getMilliseconds();
    const w = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][d];
    document.getElementById("date").innerHTML = y + "/" + m + "/" + d;
    document.getElementById("time").innerHTML = h + ":" + min + ":" + s;
}

function addzero(i) {
    if (i < 10) {
        i = "0" + i
    }
    return i
}

setInterval("time()", 1000);

let stdesktop
document.getElementById("apn").onclick = function() {
    if (stdesktop) {
        document.getElementById("desktop").style.display = "none"
        stdesktop = false
    } else {
        document.getElementById("desktop").style.display = "flex"
        stdesktop = true
    }
}

document.getElementById("cont").style.top = document.getElementById("main").style.height + 1 + "px"

function bw() {}

document.getElementById("xsxx").innerHTML = `
system@ahouse:
<input type="text" id="cmd">
<button onclick="qxx()">Enter</button>
<br><br>
<hr>
<div id="output"></div>
`

function qxx() {
    const code = document.getElementById("cmd").value;
    try {
        eval(code);
        const result = eval(code);
        document.getElementById('output').innerHTML = document.getElementById('output').innerHTML + "<br>" + document.getElementById("date").innerHTML + " " + document.getElementById("time").innerHTML + "|T|>" + code + "<|" + result;
    } catch (error) {
        document.getElementById('output').innerHTML = document.getElementById('output').innerHTML + "<br>" + document.getElementById("date").innerHTML + " " + document.getElementById("time").innerHTML + "|F|>" + code + "<|" + error.message;
    }
}