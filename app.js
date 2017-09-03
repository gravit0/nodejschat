var io = require('socket.io').listen(8001);
var fs = require('fs');
var history = [];
var admins = [];
var users = [];
var bannedusers = [];
var server = {};
server.sendAll = function(text)
{
    users.forEach(function(item,i) {
        if(item.allows.readchat)
        item.socket.json.send(text);
    });
}
server.returnAssessDenied = function(user)
{
    user.socket.json.send({"event": 'cmderror','error': "Assess Denied"});
}
server.sendUser = function(user,text)
{
    if(user.allows.readchat)
        user.socket.json.send(text);
}
server.restart =  function() {
    child_process.execFile('./restart.sh');
};
function findUserForID(id)
{
    var result;
    users.forEach(function(item,i) {
        if(item.ID == id)
        result = item;
    });
    return result;
}
const child_process = require('child_process');
// Отключаем вывод полного лога - пригодится в production'е
// Навешиваем обработчик на подключение нового клиента
console.log('Server on 8001');
fs.open('/run/user/1000/node.pid', "w+", 0644, function(err, file_handle) {
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
    var ID = (socket.id).toString().substr(0, 8);
    var user = {
        "ID": ID,
        "isAuth": false,
        "socket": socket,
        "isAdmin": false,
        "allows": {
            "writechat": true,
            "readchat": true
        }
    };
    socket.nameID = ID;
    var adminID = 0;
    users.push(user);
    var userID = users.length - 1;
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
            if(json['name'] != undefined) {
            var oldUsr = findUserForID(json['name']);
            if(oldUsr != undefined)
            {
                socket.json.send({'event': 'cmd',"command":"authError", 'name': ID});
                return;
            }
            if(bannedusers.indexOf(json['name']) >= 0)
            {
                socket.json.send({'event': "youBannedError", 'name': ID});
                socket.disconnect();
                return;
            }
            if(json['name'].length > 3) {
                var oldname = ID;
                ID = json['name'];
                user.ID = ID;
            }
            }
            socket.json.send({'event': 'connected', 'name': ID});
            socket.broadcast.json.send({'event': 'userJoined', 'name': ID});
            console.log(oldname+' log in to '+ID);
            user.isAuth = true;
            if(json['history'] == true) socket.json.send({'event': 'cmd','command': 'history','data': history});
        }
        if(!user.isAuth)
        {
            socket.json.send({'event': 'loginplease'});
            return;
        }
        if(json['t'] == 'msg')
        {
            // Уведомляем клиента, что его сообщение успешно дошло до сервера
            if(user.allows.writechat) {
                var time = (new Date).toLocaleTimeString();
                socket.json.send({'event': 'messageSent', 'name': ID, 'text': json['text']});
                // Отсылаем сообщение остальным участникам чата
                socket.broadcast.json.send({'event': 'messageReceived', 'name': ID, 'text': json['text']});
                history.push({'name': ID, 'text': json['text'], 'time': json['time']});
            }
            console.log(json['text']);
        }
        else if(json['t'] == 'cmd')
        {
            if(json['command'] == 'restart')
            {
                if(user.isAdmin) {
                    socket.json.send({'event': 'serverrestart'});
                    socket.broadcast.json.send({'event': 'serverrestart'});
                    server.restart();
                }
            }
            else if(json['command'] == 'setname')
            {
                var oldUsr = findUserForID(json['newname']);
                if(oldUsr != undefined)
                {
                    socket.json.send({'event': 'cmd',"command":"authError", 'name': ID});
                    return;
                }
                var oldname = ID;
                ID = json['newname'];
                socket.json.send({'event': 'newname', 'name': ID});
                socket.broadcast.json.send({'event': 'newnameuser', 'newname': ID, 'name': oldname});
                console.log(oldname+' set name to '+ID);
            }
            else if(json['command'] == 'say')
            {
                if(user.isAdmin) {
                    socket.json.send({'event': 'say', 'name': ID,'text': json['text']});
                    socket.broadcast.json.send({'event': 'say', 'name': ID,'text': json['text']});
                    console.log(ID+' say:'+json['text']);
                }
                else server.returnAssessDenied (user);
            }
            
            else if(json['command'] == 'users')
            {
                console.log(users);
                var names = [];
                users.forEach(function(item,i) {
                    names[i] = item.ID;
                });
                socket.json.send({'event': 'cmd','command': 'users', 'name': ID,'arr': names});
            }
            else if(json['command'] == 'history')
            {
                socket.json.send({'event': 'cmd','command': 'history','data': history});
            }
            else if(json['command'] == 'su')
            {
                user.isAdmin=true;
                socket.json.send({'event': 'adminlogin', 'name': ID});
                socket.broadcast.json.send({'event': 'adminlogin', 'name': ID});
                admins.push(ID);
                adminID = admins.length - 1;
                console.log(ID+' login to admin. ID:'+adminID);
            }
            else if(json['command'] == 'kick')
            {
                if(user.isAdmin) {
                    var clients = io.sockets.clients();
                    var targetclient = findUserForID(json['name']);
                    if(!targetclient)
                    {
                        console.log('Client '+json['name']+' not found');
                        return;
                    }
                    if(!json['reason']) json['reason'] = 'Не указана';
                    socket.json.send({'event': 'kick', 'admin': user.ID, 'user': json['name'],reason: json['reason']});
                    socket.broadcast.json.send({'event': 'kick', 'admin': user.ID, 'user': json['name'],reason: json['reason']});
                    console.log(targetclient);
                    targetclient.socket.disconnect(true);
                }
                else server.returnAssessDenied (user);
            }
            else if(json['command'] == 'ban')
            {
                if(user.isAdmin) {
                    var clients = io.sockets.clients();
                    var targetclient = findUserForID(json['name']);
                    if(!targetclient)
                    {
                        console.log('Client '+json['name']+' not found');
                        return;
                    }
                    if(!json['reason']) json['reason'] = 'Не указана';
                    socket.json.send({'event': 'ban', 'admin': user.ID, 'user': json['name'],reason: json['reason']});
                    socket.broadcast.json.send({'event': 'ban', 'admin': user.ID, 'user': json['name'],reason: json['reason']});
                    //console.log(targetclient);
                    bannedusers.push(json['name']);
                    targetclient.socket.disconnect(true);
                }
                else server.returnAssessDenied (user);
            }
            else if(json['command'] == 'makeadmin')
            {
                if(user.isAdmin) {
                    var clients = io.sockets.clients();
                    var targetclient = findUserForID(json['name']);
                    if(!targetclient)
                    {
                        console.log('Client '+json['name']+' not found');
                        return;
                    }
                    if(!json['reason']) json['reason'] = 'Не указана';
                    socket.json.send({'event': 'makeadmin', 'admin': user.ID, 'user': json['name']});
                    socket.broadcast.json.send({'event': 'makeadmin', 'admin': user.ID, 'user': json['name']});
                    if(!json['fake']) targetclient.isAdmin = true;
                }
                else server.returnAssessDenied (user);
            }
            else if(json['command'] == 'unban')
            {
                if(user.isAdmin) {
                    var name = json['name'];
                    var userid = bannedusers.indexOf(name);
                    
                    bannedusers.splice(userid,1);
                    socket.json.send({'event': 'unban', 'admin': user.ID, 'user': name});
                    socket.broadcast.json.send({'event': 'unban', 'admin': user.ID, 'user': name});
                }
                else server.returnAssessDenied (user);
            }
        }
        socket.json.send({'event': 'ping'});
    });
    // При отключении клиента - уведомляем остальных
    socket.on('disconnect', function() {
        io.sockets.json.send({'event': 'userSplit', 'name': ID});
        var massID = 0;
        users.forEach(function(item,i) {
            if(item.ID == ID)  {massID = i;
                }
        });
        users.splice(massID,1);
        if(user.isAdmin) delete admins[adminID];
    });
});
