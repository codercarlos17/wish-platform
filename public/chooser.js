/*
  HOME PAGE LOGIC

  1. Ask the server for the list of occasions (GET /api/templates) and draw one
     card for each. Add an occasion to templates.js and a card appears by itself.
  2. The "request an occasion" box sends a short note to POST /api/requests.
*/

const grid = document.getElementById('grid');

// Small helper: make an element with some text (textContent never runs HTML).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawCard(template) {
  const card = el('article', 'card');
  // The card wears the template's own colors.
  card.style.setProperty('--bg', template.colors.bg);
  card.style.setProperty('--text', template.colors.text);

  const main = el('a', 'card-main');
  main.href = '/create/' + encodeURIComponent(template.id);
  main.append(
    el('span', 'emoji', template.emoji),
    el('h2', '', template.name),
    el('p', '', template.tagline),
    el('span', 'go', 'Create this wish')
  );

  const example = el('a', 'card-example', 'See an example');
  example.href = '/example/' + encodeURIComponent(template.id);

  card.append(main, example);
  return card;
}

async function loadTemplates() {
  try {
    const response = await fetch('/api/templates');
    if (!response.ok) throw new Error('bad response');
    const templates = await response.json();
    grid.replaceChildren(...templates.map(drawCard));
  } catch (err) {
    grid.replaceChildren(el('p', 'loading', 'Could not load the occasions. Please refresh the page.'));
  }
}

// ----- Request an occasion -----
const requestForm = document.getElementById('requestForm');
const requestText = document.getElementById('requestText');
const requestMsg = document.getElementById('requestMsg');

function say(text, ok) {
  requestMsg.textContent = text;
  requestMsg.className = 'request-msg ' + (ok ? 'ok' : 'bad');
  requestMsg.hidden = false;
}

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = requestText.value.trim();
  if (text.length < 3) return say('Please write at least a few letters.', false);

  const button = requestForm.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not send that.');
    requestText.value = '';
    say('Thank you! We have noted it.', true);
  } catch (err) {
    say(err.message, false);
  } finally {
    button.disabled = false;
  }
});

loadTemplates();
