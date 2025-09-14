import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const pcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function Call() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState({}); // { socketId: RTCPeerConnection }
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => () => {
    // cleanup
    Object.values(peers).forEach(pc => pc.close());
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const addRemoteVideo = (id, stream) => {
    let el = document.getElementById(`remote-${id}`);
    if (!el) {
      el = document.createElement("video");
      el.id = `remote-${id}`;
      el.autoplay = true;
      el.playsInline = true;
      el.muted = false;
      el.style.width = "280px";
      el.style.borderRadius = "12px";
      document.getElementById("remotes").appendChild(el);
    }
    el.srcObject = stream;
  };

  const createPeer = (theirId) => {
    const pc = new RTCPeerConnection(pcConfig);
    localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.ontrack = (e) => addRemoteVideo(theirId, e.streams[0]);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("signal", { roomId, data: { ice: e.candidate }, to: theirId });
      }
    };
    return pc;
  };

  const joinRoom = async () => {
    if (!roomId.trim()) return alert("Enter a room ID");
    // media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    // socket
    const socket = io(BACKEND, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { roomId, user: { name: "User" } });
      setJoined(true);
    });

    socket.on("peer-joined", async ({ id }) => {
      const pc = createPeer(id);
      setPeers(p => ({ ...p, [id]: pc }));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", { roomId, data: { sdp: offer }, to: id });
    });

    socket.on("signal", async ({ from, data }) => {
      let pc = peers[from];
      if (!pc) {
        pc = createPeer(from);
        setPeers(p => ({ ...p, [from]: pc }));
      }
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { roomId, data: { sdp: answer }, to: from });
        }
      } else if (data.ice) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.ice)); } catch {}
      }
    });
  };

  return (
    <main className="section">
      <div className="container">
        <div className="card card--elevated">
          <div className="card__head">
            <h3 className="card__title">Group Call</h3>
            <p className="card__subtitle">Join by Room ID. Share the same ID with others.</p>
          </div>
          <div className="card__body">
            {!joined ? (
              <div className="stack">
                <input className="input" placeholder="Enter Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
                <button className="btn" onClick={joinRoom}>Join</button>
              </div>
            ) : (
              <div className="grid2">
                <div>
                  <p className="muted">You</p>
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 12 }} />
                </div>
                <div>
                  <p className="muted">Peers</p>
                  <div id="remotes" className="grid3" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
