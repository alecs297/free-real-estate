// To be minimized
function urlencodeFormData(fd){
    var params = new URLSearchParams();
    for(var pair of fd.entries()){
        typeof pair[1]=='string' && params.append(pair[0], pair[1]);
    }
    return params.toString();
}
document.getElementById("button").onclick = function()
{
    request = new XMLHttpRequest();
    form = document.getElementById("form");
    error = document.getElementById("error");
    request.open('POST', "/api/register");
    request.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
    request.send(urlencodeFormData(new FormData(form)));
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            data = JSON.parse(this.responseText);
            if (data.url) {
                location.replace(data.url);
            }
            if (data.error) {
                error.hidden = false;
                error.innerHTML = data.error;
            }
        }
    };
    return false;
}