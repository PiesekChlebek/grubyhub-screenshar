const startButton = document.getElementById("startScreenShare");
const connectButton = document.getElementById("connect");
const remoteIdInput = document.getElementById("remoteId");
const videoElement = document.getElementById("screenVideo");
const myIdSpan = document.getElementById("myId");

const peer = new Peer();

peer.on("open", id => {
    myIdSpan.textContent = id;
});

peer.on("call", call => {
    call.answer(); 
    call.on("stream", remoteStream => {
        videoElement.srcObject = remoteStream;
    });
});

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
