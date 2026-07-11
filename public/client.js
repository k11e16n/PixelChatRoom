import { initCharacterSelect, setSubmitEnabled, hideCharacterSelect } from './character-select.js';
import { initRoom } from './room.js';

const statusEl = document.getElementById('status');
const roomPlaceholder = document.getElementById('room-placeholder');
const roomCanvas = document.getElementById('room-canvas');
const socket = new WebSocket(`ws://${location.host}`);
let pendingAppearance = null;

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
    initRoom({ ctx: roomCanvas.getContext('2d'), selfAppearance: pendingAppearance });
  }
};

initCharacterSelect({
  onSubmit: ({ name, appearance }) => {
    pendingAppearance = appearance;
    socket.send(JSON.stringify({ type: 'join', name, appearance }));
  },
});
