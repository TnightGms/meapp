const socket = io();
const username = localStorage.getItem("user");

if(!username) window.location = "/";

socket.emit("join", username);

const input = document.getElementById("input");

input.addEventListener("input", () => {
    socket.emit("typing");
});

function sendMessage(){
    if(input.value.trim() !== ""){
        socket.emit("message", {
            user: username,
            text: input.value
        });
        input.value = "";
    }
}

socket.on("load messages", (messages)=>{
    messages.forEach(addMessage);
});

socket.on("message", addMessage);

socket.on("system", msg=>{
    addMessage({ user:"Sistema", text:msg });
});

socket.on("typing", user=>{
    document.getElementById("typing").innerText = user + " está escribiendo...";
    setTimeout(()=> document.getElementById("typing").innerText="",2000);
});

function addMessage(data){
    const div = document.createElement("div");
    div.classList.add("message");

    if(data.user === username){
        div.classList.add("me");
    } else {
        div.classList.add("other");
    }

    div.innerHTML = "<strong>"+data.user+":</strong> "+data.text;
    document.getElementById("messages").appendChild(div);
}
