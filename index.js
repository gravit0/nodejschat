function includeJavaScript(url) {
    var script = document.createElement('script');
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}
function apirequest(url,func)
{
    $.ajax({
        type: 'POST',
        url: "index.php?r=api&"+url,
        success: func
    });
}
includeJavaScript('http://'+location.host+':8001/socket.io/socket.io.js');
includeJavaScript('client.js');
