// To be minimized

window.onload = function()
{
    request = new XMLHttpRequest();
    data = {};
    avatar = document.getElementById("avatar");
    content = document.getElementById("content");
    username = document.getElementById("username");
    displayname = document.getElementById("displayname");
    profile = window.location.pathname.slice(2);
    avatar.src = "/api/avatar/" + profile;
    request.open('GET', "/api/profile/" + profile);
    request.send();
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            data = JSON.parse(this.responseText);
            content.innerHTML = data.bio;
            username.innerHTML = `@${data.username}`;
            displayname.innerHTML = data.name;
            document.title = username.innerHTML;
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            link.href = avatar.src;
            document.head.appendChild(link);
        }
    };
}