import { initCharacterSelect, setSubmitEnabled, hideCharacterSelect } from './character-select.js';

const statusEl = document.getElementById('status');
const roomPlaceholder = document.getElementById('room-placeholder');
const roomInfoEl = document.getElementById('room-info');
const socket = new WebSocket(`ws://${location.host}`);

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
    roomInfoEl.textContent = `已進入房間（self_id: ${message.self_id}）`;
  }
};

initCharacterSelect({
  onSubmit: ({ name, appearance }) => {
    socket.send(JSON.stringify({ type: 'join', name, appearance }));
  },
});
