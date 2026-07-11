import { drawCharacter, GRID_W, GRID_H, HAIR_STYLES, OUTFIT_STYLES, COLOR_PALETTE } from './character.js';

const sectionEl = document.getElementById('character-select');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const hairSelect = document.getElementById('hair-select');
const outfitSelect = document.getElementById('outfit-select');
const colorSelect = document.getElementById('color-select');
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');

function populateSelect(selectEl, count, labelPrefix) {
  selectEl.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${labelPrefix} ${i + 1}`;
    selectEl.appendChild(option);
  }
}

function currentAppearance() {
  return {
    hair: Number(hairSelect.value),
    outfit: Number(outfitSelect.value),
    color: Number(colorSelect.value),
  };
}

function redrawPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCharacter(ctx, currentAppearance(), 0, 0, 1);
}

export function initCharacterSelect({ onSubmit }) {
  canvas.width = GRID_W;
  canvas.height = GRID_H;

  populateSelect(hairSelect, HAIR_STYLES.length, '髮型');
  populateSelect(outfitSelect, OUTFIT_STYLES.length, '服裝');
  populateSelect(colorSelect, COLOR_PALETTE.length, '顏色');

  for (const el of [hairSelect, outfitSelect, colorSelect]) {
    el.addEventListener('change', redrawPreview);
  }

  joinButton.addEventListener('click', () => {
    onSubmit({ name: nameInput.value, appearance: currentAppearance() });
  });

  redrawPreview();
}

export function setSubmitEnabled(enabled) {
  joinButton.disabled = !enabled;
}

export function hideCharacterSelect() {
  sectionEl.hidden = true;
}
