const startButton = document.getElementById("startScreenShare");
const stopButton = document.getElementById("stopScreenShare");
const connectButton = document.getElementById("connect");
const remoteIdInput = document.getElementById("remoteId");
const videoElement = document.getElementById("screenVideo");
const myIdSpan = document.getElementById("myId");
const displayNameSpan = document.getElementById("displayName");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessageButton = document.getElementById("sendMessage");
const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const setNameButton = document.getElementById("setName");
const skipNameButton = document.getElementById("skipName");

const peer = new Peer();
let localStream = null;
let connections = [];
let userName = "";

nameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        setUserName();
    }
});

setNameButton.addEventListener("click", setUserName);

skipNameButton.addEventListener("click", () => {
    userName = peer.id ? peer.id.substring(0, 8) : "Anonymous";
    displayNameSpan.textContent = userName;
    nameModal.style.display = "none";
});

function setUserName() {
    const name = nameInput.value.trim();
    if (name) {
        userName = name;
        displayNameSpan.textContent = userName;
        nameModal.style.display = "none";
    }
}

peer.on("open", id => {
    myIdSpan.textContent = id;
    if (!userName) {
        skipNameButton.textContent = `Skip (use ${id.substring(0, 8)})`;
    }
});

peer.on("connection", conn => {
    setupConnection(conn);
});

peer.on("call", call => {
    if (localStream) {
        call.answer(localStream);
    } else {
        call.answer();
    }
    
    call.on("stream", remoteStream => {
        videoElement.srcObject = remoteStream;
    });
    
    call.on("error", err => {
        console.error("Call error:", err);
    });
});

function setupConnection(conn) {
    connections.push(conn);
    
    conn.on("data", data => {
        if (data.type === "chat") {
            addChatMessage(data.userName, data.message, data.timestamp);
        } else if (data.type === "name_request") {
            conn.send({
                type: "name_response",
                userName: userName
            });
        } else if (data.type === "name_response") {
            // Store peer name if needed
        }
    });
    
    conn.on("open", () => {
        conn.send({
            type: "name_request"
        });
        
        if (localStream) {
            const call = peer.call(conn.peer, localStream);
            call.on("error", err => {
                console.error("Call error:", err);
            });
        }
    });
    
    conn.on("close", () => {
        connections = connections.filter(c => c !== conn);
    });
    
    conn.on("error", err => {
        console.error("Connection error:", err);
    });
}

function addChatMessage(userName, message, timestamp) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "chat-message-header";
    
    const peerSpan = document.createElement("span");
    peerSpan.className = "chat-message-peer";
    peerSpan.textContent = userName;
    
    const timeSpan = document.createElement("span");
    timeSpan.className = "chat-message-time";
    timeSpan.textContent = formatTimestamp(timestamp);
    
    headerDiv.appendChild(peerSpan);
    headerDiv.appendChild(timeSpan);
    
    const textDiv = document.createElement("div");
    textDiv.className = "chat-message-text";
    textDiv.textContent = message;
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(textDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    const timestamp = Date.now();
    
    addChatMessage(userName, message, timestamp);
    
    connections.forEach(conn => {
        if (conn.open) {
            conn.send({
                type: "chat",
                userName: userName,
                message: message,
                timestamp: timestamp
            });
        }
    });
    
    chatInput.value = "";
}

sendMessageButton.addEventListener("click", sendChatMessage);

chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendChatMessage();
    }
});

startButton.addEventListener("click", async () => {
    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: true
        });

        videoElement.srcObject = localStream;
        startButton.style.display = "none";
        stopButton.style.display = "inline-block";

        localStream.getTracks().forEach(track => {
            track.onended = () => {
                stopSharing();
            };
        });

        peer.on("connection", conn => {
            setupConnection(conn);
        });

    } catch (error) {
        console.error("Error sharing screen:", error);
    }
});

stopButton.addEventListener("click", () => {
    stopSharing();
});

function stopSharing() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    videoElement.srcObject = null;
    startButton.style.display = "inline-block";
    stopButton.style.display = "none";
}

connectButton.addEventListener("click", () => {
    const remoteId = remoteIdInput.value.trim();
    
    if (!remoteId) {
        console.error("Please enter a valid ID");
        return;
    }
    
    const conn = peer.connect(remoteId);
    setupConnection(conn);
    
    conn.on("open", () => {
        const call = peer.call(remoteId, new MediaStream());
        call.on("stream", remoteStream => {
            videoElement.srcObject = remoteStream;
        });
        call.on("error", err => {
            console.error("Call error:", err);
        });
    });
});
