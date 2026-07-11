const statusEl = document.getElementById('status');
const socket = new WebSocket(`ws://${location.host}`);

socket.onopen = () => {
  console.log('WebSocket connected');
  statusEl.textContent = '已連線';
};

socket.onclose = () => {
  console.log('WebSocket disconnected');
  statusEl.textContent = '已斷線';
};

socket.onerror = (err) => {
  console.log('WebSocket error', err);
  statusEl.textContent = '連線錯誤';
};
