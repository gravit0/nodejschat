// Создаем текст сообщений для событий
strings = {
	'connected': '[sys][time]%time%[/time]: Вы успешно соединились к сервером как [user]%name%[/user].[/sys]',
	'userJoined': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] присоединился к чату.[/sys]',
    'loginplease': '[sys][time]%time%[/time]: Вы должны авторизироватся.[/sys]',
    'serverrestart': '[sys][time]%time%[/time]: Происходит перезапуск сервера. Подождите.[/sys]',
	'messageSent': '[out][time]%time%[/time]: [user]%name%[/user]: %text%[/out]',
	'messageReceived': '[in][time]%time%[/time]: [user]%name%[/user]: %text%[/in]',
	'userSplit': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] покинул чат.[/sys]'
};
function log_send(logid,data)
{
    var logdata = strings[logid].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>');
    $.each(data,function(key,value) {
        logdata = logdata.replace("%"+key+"%", value);
    });
    document.querySelector('#log').innerHTML += logdata + '<br>';
}
function send_message(msgdata)
{
    
    if(msgdata[0] != '/') {
        var res ={'t': 'msg', 'text': escape(document.querySelector('#input').value)};
        socket.json.send(JSON.stringify(res));
    }
    else
    {
        var args = msgdata.split(' ');
        console.log(msgdata);
        if(args[0] == '/restart')
        {
            var res ={'t': 'cmd', 'command': 'restart'};
            socket.json.send(JSON.stringify(res));
        }
    }
}
window.onload = function() {
    var myname = prompt('Введите Ваш никнейм:','');
	// Создаем соединение с сервером; websockets почему-то в Хроме не работают, используем xhr
	if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
		socket = io.connect('http://localhost:8080', {'transports': ['xhr-polling']});
	} else {
		socket = io.connect('http://localhost:8080');
	}
	socket.on('connect', function () {
        var resd ={'t': 'login', 'name': myname};
		socket.json.send(JSON.stringify(resd));
		socket.on('message', function (msg) {
			// Добавляем в лог сообщение, заменив время, имя и текст на полученные
			//document.querySelector('#log').innerHTML += strings[msg.event].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>').replace(/\%time\%/, msg.time).replace(/\%name\%/, msg.name).replace(/\%text\%/, unescape(msg.text).replace('<', '&lt;').replace('>', '&gt;')) + '<br>';
            log_send(msg.event,msg);
			// Прокручиваем лог в конец
			document.querySelector('#log').scrollTop = document.querySelector('#log').scrollHeight;
		});
		// При нажатии <Enter> или кнопки отправляем текст
		document.querySelector('#input').onkeypress = function(e) {
			if (e.which == '13') {
				// Отправляем содержимое input'а, закодированное в escape-последовательность
                send_message(escape(document.querySelector('#input').value));
				// Очищаем input
				document.querySelector('#input').value = '';
			}
		};
		document.querySelector('#send').onclick = function() {
            send_message(escape(document.querySelector('#input').value));
			document.querySelector('#input').value = '';
		};		
	});
};
