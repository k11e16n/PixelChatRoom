import { initCharacterSelect, setSubmitEnabled, hideCharacterSelect } from './character-select.js';
import { initRoom } from './room.js';

const statusEl = document.getElementById('status');
const roomPlaceholder = document.getElementById('room-placeholder');
const roomCanvas = document.getElementById('room-canvas');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const socket = new WebSocket(`ws://${location.host}`);
let pendingAppearance = null;
let roomHandle = null;
let selfId = null;
let rejected = false;

socket.onopen = () => {
  console.log('WebSocket connected');
  statusEl.textContent = '已連線';
  setSubmitEnabled(true);
};

socket.onclose = () => {
  console.log('WebSocket disconnected');
  if (!rejected) {
    statusEl.textContent = '已斷線';
  }
  setSubmitEnabled(false);
};

socket.onerror = (err) => {
  console.log('WebSocket error', err);
  statusEl.textContent = '連線錯誤';
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received', message);

  if (message.type === 'room_state') {
    selfId = message.self_id;
    hideCharacterSelect();
    roomPlaceholder.hidden = false;
    roomHandle = initRoom({
      ctx: roomCanvas.getContext('2d'),
      selfAppearance: pendingAppearance,
      selfId,
      initialPlayers: message.players.filter((p) => p.id !== message.self_id),
      onMove: (x, y) => socket.send(JSON.stringify({ type: 'move', x, y })),
    });
  } else if (message.type === 'player_joined') {
    roomHandle?.addPlayer(message.id, message.appearance, message.x, message.y);
  } else if (message.type === 'player_moved') {
    roomHandle?.updatePlayerPosition(message.id, message.x, message.y);
  } else if (message.type === 'player_left') {
    roomHandle?.removePlayer(message.id);
  } else if (message.type === 'player_chat') {
    roomHandle?.showBubble(message.id, message.text);
  } else if (message.type === 'room_full') {
    rejected = true;
    statusEl.textContent = message.message;
  }
};

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  socket.send(JSON.stringify({ type: 'chat', text }));
  roomHandle?.showBubble(selfId, text);
  chatInput.value = '';
});

initCharacterSelect({
  onSubmit: ({ name, appearance }) => {
    pendingAppearance = appearance;
    socket.send(JSON.stringify({ type: 'join', name, appearance }));
  },
});
