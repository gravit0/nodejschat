// Создаем текст сообщений для событий
$.client ={};
$.client.strings = {
	'connected': '[sys][time]%time%[/time]: Вы успешно соединились к сервером как [user]%name%[/user][/sys]',
    'disconnected': '[sys][time]%time%[/time]: Вы отсоеденены от сервера[/sys]',
	'userJoined': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] присоединился к чату[/sys]',
    'loginplease': '[sys][time]%time%[/time]: Вы должны авторизироватся[/sys]',
    'serverrestart': '[sys][time]%time%[/time]: Происходит перезапуск сервера. Подождите[/sys]',
    'adminlogin': '[sys][time]%time%[/time]: [admin]%name%[/admin] авторизировался как администратор[/sys]',
    'kick': '[sys][time]%time%[/time]: [admin]%admin%[/admin] кикнул пользователя [user]%user%[/user]. Причина: %reason%[/sys]',
    'youBannedError': '[sys][time]%time%[/time]: Вы забанены на этом сервере',
    'ban': '[sys][time]%time%[/time]: [admin]%admin%[/admin] забанил пользователя [user]%user%[/user]. Причина: %reason%[/sys]',
    'unban': '[sys][time]%time%[/time]: [admin]%admin%[/admin] разбанил пользователя [user]%user%[/user][/sys]',
    'makeadmin': '[sys][time]%time%[/time]: Администратор [admin]%admin%[/admin] выдал права админа [user]%user%[/user][/sys]',
    'offadmin': '[sys][time]%time%[/time]: Администратор [admin]%admin%[/admin] снял права админа [user]%user%[/user][/sys]',
    'say': '[say][time]%time%[/time]: Администратор [admin]%name%[/admin]: %text%[/say]',
    'newname': '[sys][time]%time%[/time]: Вы теперь известны как [user]%name%[/user].[/sys]',
    'newnameuser': '[sys][time]%time%[/time]: [user]%name%[/user] теперь известен как [user]%newname%[/user].[/sys]',
	'messageSent': '[out][time]%time%[/time]: [user]%name%[/user]: %text%[/out]',
	'messageReceived': '[in][time]%time%[/time]: [user]%name%[/user]: %text%[/in]',
	'userSplit': '[sys][time]%time%[/time]: Пользователь [user]%name%[/user] покинул чат.[/sys]'
};
$.client.log_send =  function(logid,data)
    {
        data.time = (new Date).toLocaleTimeString();
        console.log( $.client.strings[logid]);
        logdata = $.client.strings[logid].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>');
            $.each(data,function(key,value) {
            logdata = logdata.replace("%"+key+"%", value);
        });
        
        document.querySelector('#log').innerHTML += logdata + '<br>';
    };
$.client.func = {};
$.client.func.getmyadmin = function()
{
    var res ={'t': 'cmd', 'command': 'su'};
    socket.json.send(JSON.stringify(res));
}
$.client.send_message =    function(msgdata)
    {
    
        if(msgdata[0] != '/') {
            var res ={'t': 'msg', 'text': document.querySelector('#input').value};
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
            else if(args[0] == '/history')
            {
                var res ={'t': 'cmd', 'command': 'history'};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/hack')
            {
                $.client.log_send('adminlogin',{name: $.client.name});
            }
            else if(args[0] == '/kick')
            {
                var name;
                if(args.length == 1) name = prompt('Имя пользователя:','');
                else name = args[1];
                var reason;
                if(args.length <= 2) reason = prompt('Причина:','');
                else reason = args[2];
                var res ={'t': 'cmd', 'command': 'kick','name': name,'reason': reason};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/ban')
            {
                var name;
                if(args.length == 1) name = prompt('Имя пользователя:','');
                else name = args[1];
                var reason;
                if(args.length <= 2) reason = prompt('Причина:','');
                else reason = args[2];
                var res ={'t': 'cmd', 'command': 'ban','name': name,'reason': reason};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/unban')
            {
                var name;
                if(args.length == 1) name = prompt('Имя пользователя:','');
                else name = args[1];
                var res ={'t': 'cmd', 'command': 'unban','name': name};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/makeadmin')
            {
                var name;
                if(args.length == 1) name = prompt('Имя пользователя:','');
                else name = args[1];
                var res ={'t': 'cmd', 'command': 'makeadmin','name': name};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/fakemakeadmin')
            {
                var name;
                if(args.length == 1) name = prompt('Имя пользователя:','');
                else name = args[1];
                var res ={'t': 'cmd', 'command': 'makeadmin','name': name,'fake': 'true'};
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/setname')
            {
                if(!args[1])
                var name = prompt('Ваше новое имя:','');
                else
                var name = args[1];
                var res ={'t': 'cmd', 'command': 'setname','newname': name};
                $.client.name = name;
                socket.json.send(JSON.stringify(res));
            }
            else if(args[0] == '/say')
            {
                
                var text;
                if(args.length == 1) text = prompt('Что вы хотите сказать:','');
                else {args.splice(0,1);text = args.join(' ');}
                var res ={'t': 'cmd', 'command': 'say','text': text};
                socket.json.send(JSON.stringify(res));
            }
        }
    };
$.client.socket = {};
if(!username) $.client.name = prompt('Введите Ваш никнейм:','');
else $.client.name = username;
$.client.socket.message =  function (msg) {
			// Добавляем в лог сообщение, заменив время, имя и текст на полученные
			//document.querySelector('#log').innerHTML += strings[msg.event].replace(/\[([a-z]+)\]/g, '<span class="$1">').replace(/\[\/[a-z]+\]/g, '</span>').replace(/\%time\%/, msg.time).replace(/\%name\%/, msg.name).replace(/\%text\%/, unescape(msg.text).replace('<', '&lt;').replace('>', '&gt;')) + '<br>';
            console.log(msg);
            if(msg.event == "ping") return;
            if(msg.event == 'cmd')
            {
                if(msg.command = 'history')
                {
                    msg.data.forEach(function(v) {
                        $.client.log_send('messageReceived',v);
                    });
                }
                return;
            }
            $.client.log_send(msg.event,msg);
			// Прокручиваем лог в конец
			document.querySelector('#log').scrollTop = document.querySelector('#log').scrollHeight;
};
$.client.socket.connect = function () {
        var resd ={'t': 'login', 'name': $.client.name};
        console.log(resd);
		socket.json.send(JSON.stringify(resd));
		// При нажатии <Enter> или кнопки отправляем текст
    };
$.client.socket.disconnect = function()
{
    var time = (new Date).toLocaleTimeString();
    $.client.log_send('disconnected',{'time': time});
};
window.onload = function() {
	// Создаем соединение с сервером; websockets почему-то в Хроме не работают, используем xhr
	if (location.protocol != 'https:')
            socket = io.connect('http://'+location.host+':8001');
        else
            socket = io.connect('https://chat.gateway.'+location.host,{secure: true});
	socket.on('connect',$.client.socket.connect);
    socket.on('message',$.client.socket.message);
    socket.on('disconnect',$.client.socket.disconnect);
    document.querySelector('#input').onkeypress = function(e) {
			if (e.which == '13') {
				// Отправляем содержимое input'а, закодированное в escape-последовательность
                $.client.send_message(document.querySelector('#input').value);
				// Очищаем input
				document.querySelector('#input').value = '';
			}
        };
    document.querySelector('#send').onclick = function() {
            $.client.send_message(document.querySelector('#input').value);
			document.querySelector('#input').value = '';
		};
};
