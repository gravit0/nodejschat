var io = require('socket.io').listen(8080);
var fs = require('fs')
const child_process = require('child_process');
// Отключаем вывод полного лога - пригодится в production'е
// Навешиваем обработчик на подключение нового клиента
console.log('Server on 8080');
fs.open('node.pid', "w+", 0644, function(err, file_handle) {
 if(err) console.log('Error print PID');
  else
    {
        fs.write(file_handle, process.pid, null, 'ascii', function(err, written) {
	        if (!err) {
	            console.log("PID успешно записан в файл");
	        } else {
	            console.log("Произошла ошибка при записи");
	        }
	    });
    }
});
io.sockets.on('connection', function (socket) {
	// Т.к. чат простой - в качестве ников пока используем первые 5 символов от ID сокета
	var ID = (socket.id).toString().substr(0, 5);
	var time = (new Date).toLocaleTimeString();
    var isAuth = false;
    console.log('Connect '+ID);
	// Посылаем клиенту сообщение о том, что он успешно подключился и его имя
	// Посылаем всем остальным пользователям, что подключился новый клиент и его имя
	// Навешиваем обработчик на входящее сообщение
	socket.on('message', function (msg) {
        try {
        var json = JSON.parse(msg);
        } catch(e)
        {
            console.log(msg);
            console.log(e);
            return;
        }
        if(json['t'] == 'login')
        {
            if(json['name'].length > 3) {
                var oldname = ID;
                ID = json['name'];
            }
            var time = (new Date).toLocaleTimeString();
            socket.json.send({'event': 'connected', 'name': ID, 'time': time});
            socket.broadcast.json.send({'event': 'userJoined', 'name': ID, 'time': time});
            console.log(oldname+' log in to '+ID);
            isAuth = true;
        }
        if(!isAuth)
        {
            socket.json.send({'event': 'loginplease', 'time': time});
            return;
        }
        if(json['t'] == 'msg')
        {
            var time = (new Date).toLocaleTimeString();
            // Уведомляем клиента, что его сообщение успешно дошло до сервера
            socket.json.send({'event': 'messageSent', 'name': ID, 'text': json['text'], 'time': time});
            // Отсылаем сообщение остальным участникам чата
            socket.broadcast.json.send({'event': 'messageReceived', 'name': ID, 'text': json['text'], 'time': time})
        }
        else if(json['t'] == 'setname')
        {
            var oldname = ID;
            ID = json['newname'];
            var time = (new Date).toLocaleTimeString();
            socket.json.send({'event': 'newname', 'name': ID, 'time': time});
            socket.broadcast.json.send({'event': 'newnameuser', 'name': ID, 'text': oldname, 'time': time});
            console.log(oldname+' set name to '+ID);
        }
        else if(json['t'] == 'cmd')
        {
            if(json['command'] == 'restart')
            {
                socket.json.send({'event': 'serverrestart', 'time': time});
                socket.broadcast.json.send({'event': 'serverrestart', 'time': time});
                child_process.execFile('./restart.sh');
            }
        }
	});
	// При отключении клиента - уведомляем остальных
	socket.on('disconnect', function() {
		var time = (new Date).toLocaleTimeString();
		io.sockets.json.send({'event': 'userSplit', 'name': ID, 'time': time});
	});
});
