window.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
    const roomId = getRoomIdFromURL();
    if (!roomId) {
        alert("Room not found in URL.");
        return;
    }

    const db = firebase.firestore();
    const gameRef = db.collection("games").doc(roomId);

     // update the UI in real-time, in case a player joins, leaves, etc.
     gameRef.onSnapshot(function (doc) {
        if (doc.exists) {
            displayLobbyInfo(doc.data());
            displayPlayers(db, roomId);
        } else {
            alert("Game not found.");
        }
    });

    // game starts if host clicks start button
    const startBtn = document.getElementById("game-lobby-start");
    startBtn.addEventListener("click", () => {
        gameRef.update({status: "started"});
    })

    // start game button disabled for non-host users, and redirect users if game starts
    gameRef.onSnapshot(doc => {
        const data = doc.data();
        const user = firebase.auth().currentUser;

        if (user.uid != data.hostUid) {
            startBtn.disabled = true;
            startBtn.classList.add("button--disabled");
        }

        if (data.status === "started") {
            const roomCode = data.roomCode;
            const targetUrl = `multi-player.html?room-code=${encodeURIComponent(roomCode)}`;

            window.location.href = targetUrl;
        }
    })

    // leaving a lobby
    const leaveBtn = document.getElementById("game-lobby-leave");
    leaveBtn.addEventListener("click", async () => {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const playerRef = gameRef.collection("players").doc(user.uid);
        try {
        //when players leave their information is deleted from the database
            await playerRef.delete();
            window.location.href = "../index.html";
        } catch (err) {
            console.error("Failed to leave lobby:", err);
            alert("Error leaving the lobby.");
        }
    });
}

function getRoomIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
}

function displayLobbyInfo(data) {
    document.getElementById("room-code").textContent = "Room Code: " + data.roomCode;
}

function displayPlayers(db, roomId) {
    const playersRef = db.collection("games").doc(roomId).collection("players");

    playersRef.onSnapshot(function (querySnapshot) {
        const playerList = document.querySelector(".player-list");

        // remove any existing entries to avoid duplication
        const oldPlayers = playerList.querySelectorAll(".player-entry");
        oldPlayers.forEach(el => el.remove());

        querySnapshot.forEach(function (doc) {
            const player = doc.data();
            // add player to player list
            const playerDiv = document.createElement("div");
            playerDiv.classList.add("player-entry");
            playerDiv.style.display = "flex";
            playerDiv.style.alignItems = "center";
            playerDiv.style.gap = "12px";
            playerDiv.style.marginTop = "10px";
            // set user profile picture
            const img = document.createElement("img");
            img.src = player.profilePicture || "../images/default-profile-icon.png";
            img.alt = player.displayName;
            img.style.width = "32px";
            img.style.borderRadius = "50%";
            // set their player name
            const name = document.createElement("span");
            name.textContent = player.displayName || "Unnamed Player";
            // to do: if they're the host, indicate them with a crown
            // another to do: not ready/ready buttons
            playerDiv.appendChild(img);
            playerDiv.appendChild(name);
            if (player.isHost) {
                playerDiv.appendChild(isHost);
            }
            playerList.appendChild(playerDiv);
        });
    });
}