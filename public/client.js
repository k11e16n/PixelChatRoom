import { initCharacterSelect, setSubmitEnabled, hideCharacterSelect } from './character-select.js';
import { initRoom } from './room.js';

const statusEl = document.getElementById('status');
const roomPlaceholder = document.getElementById('room-placeholder');
const roomCanvas = document.getElementById('room-canvas');
const socket = new WebSocket(`ws://${location.host}`);
let pendingAppearance = null;
let roomHandle = null;

socket.onopen = () => {
  console.log('WebSocket connected');
  statusEl.textContent = '已連線';
  setSubmitEnabled(true);
};

socket.onclose = () => {
  console.log('WebSocket disconnected');
  statusEl.textContent = '已斷線';
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
    hideCharacterSelect();
    roomPlaceholder.hidden = false;
    roomHandle = initRoom({
      ctx: roomCanvas.getContext('2d'),
      selfAppearance: pendingAppearance,
      initialPlayers: message.players.filter((p) => p.id !== message.self_id),
      onMove: (x, y) => socket.send(JSON.stringify({ type: 'move', x, y })),
    });
  } else if (message.type === 'player_joined') {
    roomHandle?.addPlayer(message.id, message.appearance, message.x, message.y);
  } else if (message.type === 'player_moved') {
    roomHandle?.updatePlayerPosition(message.id, message.x, message.y);
  } else if (message.type === 'player_left') {
    roomHandle?.removePlayer(message.id);
  }
};

initCharacterSelect({
  onSubmit: ({ name, appearance }) => {
    pendingAppearance = appearance;
    socket.send(JSON.stringify({ type: 'join', name, appearance }));
  },
});
