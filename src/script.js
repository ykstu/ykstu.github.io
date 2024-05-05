function time(){
    let today = new Date();
    let m = today.getMonth();
    let d = today.getDate();
    let h = checkTime(today.getHours());
    let min = checkTime(today.getMinutes());
    let w = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][today.getDay()];
    document.getElementById("sys-menu-time").innerHTML = m + "月" + d + "日 " + w + " " + h + ":" + min;
}
setInterval("time()","1000");
function date() {
	var old_date = new Date();
	var new_date = new Date("2024-6-13 09:00:00");
	var difftime = (new_date - old_date) / 1000;
	var days = parseInt(difftime / 86400);
	var hours = parseInt(difftime / 3600) - 24 * days;
	var minutes = parseInt(difftime % 3600 / 60);
	var seconds = parseInt(difftime % 60);
	var percent = 100 - difftime / 86400;
	percent4 = Math.round(percent * 100000) / 100000 + '%';
	document.getElementById('date')
		.innerHTML = "距离成都中考（语文答题时间）：" + days + " 日 " + hours + " 时 " + minutes + " 分 " + seconds + " 秒 ";
	document.getElementById('pn')
		.innerHTML = "100天：" + percent4;
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
			.innerHTML = "百100天：" + 100 + "%";
	}
}
setInterval("date()","1000");
function checkTime(i) {
	if (i < 10) {
		i = "0" + i
	}
	return i
}