const startButton = document.getElementById("startScreenShare");
const connectButton = document.getElementById("connect");
const remoteIdInput = document.getElementById("remoteId");
const videoElement = document.getElementById("screenVideo");
const myIdSpan = document.getElementById("myId");

// Create PeerJS connection
const peer = new Peer();

// Show generated ID
peer.on("open", id => {
    myIdSpan.textContent = id;
});

// Handle incoming screen-sharing stream
peer.on("call", call => {
    call.answer(); // Answer the call
    call.on("stream", remoteStream => {
        videoElement.srcObject = remoteStream;
    });
});

// Start screen sharing
startButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: true
        });

        peer.on("connection", conn => {
            conn.on("open", () => {
                const call = peer.call(conn.peer, stream);
                call.on("stream", remoteStream => {
                    videoElement.srcObject = remoteStream;
                });
            });
        });

    } catch (error) {
        console.error("Error sharing screen:", error);
    }
});

// Connect to a sharer
connectButton.addEventListener("click", () => {
    const remoteId = remoteIdInput.value;
    const conn = peer.connect(remoteId);
    conn.on("open", () => {
        const call = peer.call(remoteId);
        call.on("stream", remoteStream => {
            videoElement.srcObject = remoteStream;
        });
    });
});
