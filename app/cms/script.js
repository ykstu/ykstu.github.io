function date() {
	var old_date = new Date();
	var new_date = new Date("2024-6-10 09:00:00");
	var difftime = (new_date - old_date) / 1000;
	var days = parseInt(difftime / 86400);
	var hours = parseInt(difftime / 3600) - 24 * days;
	var minutes = parseInt(difftime % 3600 / 60);
	var seconds = parseInt(difftime % 60);
	var percent = 100 - difftime / 86400;
	percent4 = Math.round(percent * 100) / 100 + '%';
	document.getElementById('date')
		.innerHTML = "成都中考：" + days + " 日 " + hours + " 时 " + minutes + " 分 " + seconds + " 秒 ";
	document.getElementById('pn')
		.innerHTML = "百日誓师：" + percent4;
	if (percent >= 25) {
		document.getElementById('percent')
			.setAttribute("class", "progress-bar");
	}
	if (percent >= 50) {
		document.getElementById('percent')
			.setAttribute("class", "progress-bar bg-warning");
	}
	if (percent >= 75) {
		document.getElementById('percent')
			.setAttribute("class", "progress-bar bg-danger");
	}
	document.getElementById('percent')
		.style.width = percent + '%';
	document.getElementById('percent')
		.innerHTML = percent4;
	if (percent >= 100) {
		document.getElementById('date')
			.innerHTML = "距离成都中考：" + 0 + " 日 " + 0 + " 时 " + 0 + " 分 " + 0 + " 秒 ";
		document.getElementById('percent')
			.style.width = 100 + "%";
		document.getElementById('percent')
			.innerHTML = 100 + "%";
		document.getElementById('pn')
			.innerHTML = "百日誓师：" + 100 + "%";
	}
}
setInterval('date()', 1000);

function theme(theme) {
	document.getElementById('html')
		.setAttribute("data-bs-theme", theme);

}

var d = new Date();
var now = d.getTime();
var n = now - 259200000;
var dayIndex = Math.ceil(n / 86400000) - 1;
var weekIndex = Math.ceil(dayIndex / 7);
var ds = weekIndex % 2;
if (ds = 1) {
	document.getElementById('ex1')
		.innerHTML = '物理';
	document.getElementById('ex2')
		.innerHTML = '物理';
}
if (ds = 0) {
	document.getElementById('ex1')
		.innerHTML = '化学';
	document.getElementById('ex2')
		.innerHTML = '化学';
}

function startTime() {
	var today = new Date()
	var y = today.getFullYear()
	var mon = today.getMonth() + 1
	var d = today.getDate()
	var hour = today.getHours()
	var min = today.getMinutes()
	var sec = today.getSeconds()
	var weeks = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
	var w = weeks[today.getDay()]
	min = checkTime(min)
	sec = checkTime(sec)
	if (ds = 0) {
		var idf = '单周';
	} else {
		var idf = '双周';
	}
	document.getElementById('time')
		.innerHTML = y + "-" + mon + "-" + d + " " + w + " " + hour + ":" + min + ":" + sec + " " + idf
	t = setTimeout('startTime()', 500)
}
setInterval('startTime()', 1000);

function checkTime(i) {
	if (i < 10) {
		i = "0" + i
	}
	return i
}

    const url_string = window.location.href;
    const url = new URL(url_string);
    document.getElementById('sv')
		.innerHTML = 'Local Version:'+url.searchParams.get('version');
