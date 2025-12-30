const startButton = document.getElementById("startScreenShare");
const stopButton = document.getElementById("stopScreenShare");
const connectButton = document.getElementById("connect");
const remoteIdInput = document.getElementById("remoteId");
const videoElement = document.getElementById("screenVideo");
const myIdSpan = document.getElementById("myId");

const peer = new Peer();
let localStream = null;

peer.on("open", id => {
    myIdSpan.textContent = id;
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
            conn.on("open", () => {
                const call = peer.call(conn.peer, localStream);
                call.on("error", err => {
                    console.error("Call error:", err);
                });
            });
            
            conn.on("error", err => {
                console.error("Connection error:", err);
            });
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
    
    conn.on("open", () => {
        const call = peer.call(remoteId, new MediaStream());
        call.on("stream", remoteStream => {
            videoElement.srcObject = remoteStream;
        });
        call.on("error", err => {
            console.error("Call error:", err);
        });
    });
    
    conn.on("error", err => {
        console.error("Connection error:", err);
    });
});
