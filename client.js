// Создаем текст сообщений для событий
$.client ={};
$.client.strings = {
	'connected': '[sys][time]%time%[/time]: Вы успешно соединились к сервером как [user]%name%[/user].[/sys]',
	'userJoined': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] присоединился к чату.[/sys]',
    'loginplease': '[sys][time]%time%[/time]: Вы должны авторизироватся.[/sys]',
    'serverrestart': '[sys][time]%time%[/time]: Происходит перезапуск сервера. Подождите.[/sys]',
	'messageSent': '[out][time]%time%[/time]: [user]%name%[/user]: %text%[/out]',
	'messageReceived': '[in][time]%time%[/time]: [user]%name%[/user]: %text%[/in]',
	'userSplit': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] покинул чат.[/sys]'
};
$.client.log_send =  function(logid,data)
    {
        var logdata = $.client.strings[logid].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>');
            $.each(data,function(key,value) {
            logdata = logdata.replace("%"+key+"%", value);
        });
        document.querySelector('#log').innerHTML += logdata + '<br>';
    };
$.client.send_message =    function(msgdata)
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
    };
$.client.socket = {};
$.client.name = prompt('Введите Ваш никнейм:','');
$.client.socket.message =  function (msg) {
			// Добавляем в лог сообщение, заменив время, имя и текст на полученные
			//document.querySelector('#log').innerHTML += strings[msg.event].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>').replace(/\%time\%/, msg.time).replace(/\%name\%/, msg.name).replace(/\%text\%/, unescape(msg.text).replace('<', '&lt;').replace('>', '&gt;')) + '<br>';
            $.client.log_send(msg.event,msg);
			// Прокручиваем лог в конец
			document.querySelector('#log').scrollTop = document.querySelector('#log').scrollHeight;
};
$.client.socket.connect = function () {
        var resd ={'t': 'login', 'name': $.client.name};
		socket.json.send(JSON.stringify(resd));
		socket.on('message',$.client.socket.message);
		// При нажатии <Enter> или кнопки отправляем текст
		document.querySelector('#input').onkeypress = function(e) {
			if (e.which == '13') {
				// Отправляем содержимое input'а, закодированное в escape-последовательность
                client.send_message(escape(document.querySelector('#input').value));
				// Очищаем input
				document.querySelector('#input').value = '';
			}
        };
        document.querySelector('#send').onclick = function() {
            $.client.send_message(escape(document.querySelector('#input').value));
			document.querySelector('#input').value = '';
		};
    };
window.onload = function() {
	// Создаем соединение с сервером; websockets почему-то в Хроме не работают, используем xhr
	if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
		socket = io.connect('http://localhost:8080', {'transports': ['xhr-polling']});
	} else {
		socket = io.connect('http://localhost:8080');
	}
	socket.on('connect',$.client.socket.connect);
};
