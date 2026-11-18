/*
  BUILDER PAGE LOGIC  (public/create.html, address /create/<occasion>)

  Jobs:
  0. Read the occasion from the address, load its template from the server and
     fill the form (colors, sample message, message ideas, music).
  1. Live preview: when the user types or picks colors, update the right side.
  2. Keep a list of chosen photos/videos (with remove buttons) and preview them.
  3. On submit, send everything to the server and show the share link.
*/

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // keep in sync with server.js

// ----- Grab the elements we need -----
const $ = (id) => document.getElementById(id);
const form = $('wishForm');
const recipientName = $('recipientName');
const senderName = $('senderName');
const message = $('message');
const bgColor = $('bgColor');
const textColor = $('textColor');
const trackSelect = $('track');
const previewMusic = $('previewMusic');
const mediaInput = $('media');
const fileList = $('fileList');
const errorBox = $('error');
const submitBtn = $('submitBtn');
const root = document.documentElement;

// The files the user has chosen. We keep our OWN array because the browser's
// file input can't remove a single file, and picking again would replace all.
let selectedFiles = [];

// Filled in by loadTemplate() once the server answers.
let template = null;
let tracks = [];

// ----- 0. Load the occasion -----
// "/create/birthday" -> ["create", "birthday"] -> "birthday"
const templateId = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');

async function loadTemplate() {
  try {
    const [templateResponse, tracksResponse] = await Promise.all([
      fetch('/api/templates/' + encodeURIComponent(templateId)),
      fetch('/api/tracks'),
    ]);
    if (!templateResponse.ok) { location.replace('/'); return; } // unknown occasion: back to the home page
    template = await templateResponse.json();
    tracks = tracksResponse.ok ? await tracksResponse.json() : [];
    applyTemplate();
  } catch (err) {
    showError('Could not load this occasion. Please refresh the page.');
  }
}

function applyTemplate() {
  document.title = template.name + ' wish';
  $('formTitle').textContent = template.emoji + ' ' + template.name + ' wish';
  $('formTagline').textContent = template.tagline;
  $('formTagline').hidden = false;
  $('pvEmoji').textContent = template.emoji;

  // Starting colors and message (the sender can change all of them).
  bgColor.value = template.colors.bg;
  textColor.value = template.colors.text;
  root.style.setProperty('--bg', template.colors.bg);
  root.style.setProperty('--text', template.colors.text);
  message.value = template.sampleMessage;

  // Message ideas as tappable chips.
  const ideas = $('ideas');
  ideas.replaceChildren();
  (template.suggestions || []).forEach((idea) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    const tag = document.createElement('span');
    tag.className = 'chip-lang';
    tag.textContent = idea.lang;
    chip.append(tag, document.createTextNode(idea.text)); // text nodes: never HTML
    chip.addEventListener('click', () => {
      message.value = idea.text;
      updatePreview();
    });
    ideas.appendChild(chip);
  });
  $('ideasBox').hidden = !(template.suggestions && template.suggestions.length);

  // Music picker: "No music" + every track, with the template's own track selected.
  tracks.forEach((track) => {
    const option = document.createElement('option');
    option.value = track.id;
    option.textContent = track.name;
    trackSelect.appendChild(option);
  });
  trackSelect.value = tracks.some((t) => t.id === template.music) ? template.music : '';

  updatePreview();
}

// ----- Music preview (the little Play button) -----
let previewAudio = null;

function stopPreview() {
  if (previewAudio) { previewAudio.pause(); previewAudio = null; }
  previewMusic.innerHTML = '&#9654; Play';
}

previewMusic.addEventListener('click', () => {
  if (previewAudio) return stopPreview();
  const track = tracks.find((t) => t.id === trackSelect.value);
  if (!track) return; // "No music" selected: nothing to play
  previewAudio = new Audio(track.file);
  previewAudio.volume = 0.6;
  previewAudio.play().catch(() => stopPreview());
  previewAudio.addEventListener('ended', stopPreview);
  previewMusic.innerHTML = '&#9632; Stop';
});
trackSelect.addEventListener('change', stopPreview);

// ----- 1. Live preview -----
function updatePreview() {
  const name = recipientName.value.trim() || 'friend';
  $('pvTo').textContent = 'Dear ' + name + ',';
  // textContent (not innerHTML) so typed HTML is shown as text, never run.
  $('pvMessage').textContent = message.value;
  const sender = senderName.value.trim();
  const signOff = (template && template.signOff) || 'With love,';
  $('pvFrom').textContent = sender ? signOff + ' ' + sender : '';
}

function updateGallery() {
  const gallery = $('pvGallery');
  // Free the memory of old preview URLs before making new ones.
  gallery.querySelectorAll('[src]').forEach((el) => URL.revokeObjectURL(el.src));
  gallery.innerHTML = '';

  selectedFiles.forEach((file) => {
    // createObjectURL gives a temporary local URL so the browser can show the
    // file instantly, without uploading it anywhere.
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
    el.src = url;
    if (el.tagName === 'VIDEO') { el.controls = true; el.muted = true; el.playsInline = true; }
    gallery.appendChild(el);
  });
}

[recipientName, senderName, message].forEach((el) => el.addEventListener('input', updatePreview));

bgColor.addEventListener('input', () => root.style.setProperty('--bg', bgColor.value));
textColor.addEventListener('input', () => root.style.setProperty('--text', textColor.value));

// ----- 2. File list -----
function showError(text) {
  errorBox.textContent = text;
  errorBox.hidden = !text;
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = file.name; // textContent: file names are user input
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderFileList();
      updateGallery();
    });
    li.append(name, remove);
    fileList.appendChild(li);
  });
}

mediaInput.addEventListener('change', () => {
  showError('');
  for (const file of mediaInput.files) {
    const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isMedia) { showError(file.name + ' is not a photo or video.'); continue; }
    if (file.size > MAX_FILE_SIZE) { showError(file.name + ' is bigger than 50 MB.'); continue; }
    if (selectedFiles.length >= MAX_FILES) { showError('You can add at most ' + MAX_FILES + ' files.'); break; }
    selectedFiles.push(file);
  }
  mediaInput.value = ''; // reset so picking the same file again still triggers "change"
  renderFileList();
  updateGallery();
});

// ----- 3. Submit -----
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser's default full-page form submit
  showError('');
  stopPreview();

  if (!template) return showError('Still loading this occasion. Please try again in a moment.');
  if (!recipientName.value.trim()) return showError('Please enter the recipient name.');
  if (!message.value.trim()) return showError('Please write a message.');

  // FormData builds a multipart/form-data body: text fields + files together.
  const data = new FormData();
  data.append('templateId', template.id);
  data.append('track', trackSelect.value); // "" means no music
  data.append('recipientName', recipientName.value);
  data.append('senderName', senderName.value);
  data.append('message', message.value);
  data.append('bgColor', bgColor.value);
  data.append('textColor', textColor.value);
  selectedFiles.forEach((file) => data.append('media', file)); // same field name x many files

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';

  try {
    const response = await fetch('/api/wishes', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not create the wish.');
    showResult(result.url);
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create wish';
  }
});

function showResult(path) {
  const fullUrl = location.origin + path;
  $('linkBox').value = fullUrl;
  $('openLink').href = path;
  $('whatsappBtn').href = 'https://wa.me/?text=' + encodeURIComponent('I made a surprise for you: ' + fullUrl);
  $('result').hidden = false;
  $('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('linkBox').value);
    $('copyBtn').textContent = 'Copied!';
  } catch {
    $('linkBox').select(); // fallback: user presses Ctrl/Cmd+C themselves
  }
  setTimeout(() => ($('copyBtn').textContent = 'Copy link'), 1500);
});

// Draw the preview once, then load the occasion from the server.
updatePreview();
loadTemplate();
