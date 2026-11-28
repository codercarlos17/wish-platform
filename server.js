/*
  SERVER

  Pages:
    /                    home page: choose an occasion          (public/index.html)
    /create/:id          the builder for one occasion           (public/create.html)
    /wish/:slug          the page the recipient opens           (views/wish.ejs)

  Request flow when someone creates a wish:
    browser fills the form and picks files
      -> JavaScript sends it as multipart/form-data to POST /api/wishes
      -> multer saves the uploaded files into /uploads and puts the text
         fields in req.body and the files in req.files
      -> we validate everything, save a wish with store.js
      -> we reply with JSON: { url: "/wish/abc12345" }

  When someone opens a link:
    browser GETs /wish/abc12345
      -> we look the wish up by its slug
      -> we render views/wish.ejs with that data (or a 404 page)
*/

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createWish, getWishBySlug, addRequest } = require('./store');
const templates = require('./templates');
const tracks = require('./tracks');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Settings ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file

// Only these file types are accepted. The key is the MIME type the browser
// reports, the value is the file extension we save the file with.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

// ---------- multer: handles file uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // We NEVER use the original file name from the user (it could contain
    // "../" tricks or clash with another file). We make our own random name.
    filename: (req, file, cb) => {
      cb(null, crypto.randomBytes(12).toString('hex') + ALLOWED_TYPES[file.mimetype]);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    cb(new Error('Only photos (JPG, PNG, GIF, WEBP) and videos (MP4, WEBM, MOV) are allowed.'));
  },
});

// ---------- Helpers ----------
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Keep only a clean string, trimmed and cut to a max length.
function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

// Object.hasOwn: only keys that are really in OUR list count. Plain
// list[id] would wrongly accept words like "constructor", because every
// JavaScript object has built-in properties with those names.
function inList(list, id) {
  return typeof id === 'string' && Object.hasOwn(list, id);
}

// A tiny "slow down" guard for the request box: at most 5 notes per hour
// per visitor. (Kept in memory, so it resets when the server restarts.)
const requestLog = new Map();
function allowRequest(ip) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

// ---------- App setup ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Files in /public (the home page, builder page, CSS, JS, fonts, music) are served as they are.
app.use(express.static(path.join(__dirname, 'public')));
// Uploaded photos and videos are served from /uploads/<file>.
app.use('/uploads', express.static(UPLOAD_DIR));
//It's middleware again: it adds a header telling search engines "don't list this", then next() passes the request on to express.static.
app.use('/uploads', (req, res, next) => { res.set('X-Robots-Tag', 'noindex'); next(); });

// ---------- Routes ----------

// Create a wish.  upload.array('media') means: "accept up to MAX_FILES files"
// in a form field called 'media'".
app.post('/api/wishes', upload.array('media', MAX_FILES), (req, res) => {
  const recipientName = cleanText(req.body.recipientName, 80);
  const senderName = cleanText(req.body.senderName, 80);
  const message = cleanText(req.body.message, 2000);
  const bgColor = req.body.bgColor;
  const textColor = req.body.textColor;
  const templateId = req.body.templateId;
  const track = req.body.track || ''; // '' means "no music"

  // Validate. If something is wrong we delete the files multer already saved,
  // otherwise rejected requests would leave junk on disk.
  const problem =
    (!inList(templates, templateId) && 'Please choose an occasion.') ||
    (track !== '' && !inList(tracks, track) && 'Unknown music track.') ||
    (!recipientName && 'Please enter the recipient name.') ||
    (!message && 'Please write a message.') ||
    (!HEX_COLOR.test(bgColor) && 'Invalid background color.') ||
    (!HEX_COLOR.test(textColor) && 'Invalid text color.');

  if (problem) {
    (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
    return res.status(400).json({ error: problem });
  }

  const media = (req.files || []).map((f) => ({
    url: '/uploads/' + f.filename,
    type: f.mimetype.startsWith('video/') ? 'video' : 'image',
  }));

  const wish = createWish({ recipientName, senderName, message, bgColor, textColor, templateId, track, media });
  res.status(201).json({ slug: wish.slug, url: '/wish/' + wish.slug });
});

// All templates, as a list.
app.get('/api/templates', (req, res) => {
  const list = Object.keys(templates).map((id) => ({ id, ...templates[id] }));
  res.json(list);
});

// One template by id, e.g. /api/templates/birthday
app.get('/api/templates/:id', (req, res) => {
  const id = req.params.id;
  if (!inList(templates, id)) {
    return res.status(404).json({ error: 'Unknown template.' });
  }
  res.json({ id, ...templates[id] });
});

// All music tracks, as a list the builder shows in its music picker.
app.get('/api/tracks', (req, res) => {
  const list = Object.keys(tracks).map((id) => ({ id, ...tracks[id] }));
  res.json(list);
});

// The builder for one occasion. The page itself is the same file for every
// occasion; builder.js reads the id from the address and loads that template.
app.get('/create/:id', (req, res) => {
  if (!inList(templates, req.params.id)) return res.status(404).render('not-found');
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

// "Request an occasion": a short note saved so you can see what people want.
app.post('/api/requests', express.json({ limit: '2kb' }), (req, res) => {
  const text = cleanText(req.body && req.body.text, 100);
  if (text.length < 3) return res.status(400).json({ error: 'Please write at least a few letters.' });
  if (!allowRequest(req.ip)) return res.status(429).json({ error: 'Thanks! You have sent a few already. Try again later.' });
  if (!addRequest(text)) return res.status(503).json({ error: 'Not taking requests right now.' });
  res.status(201).json({ ok: true });
});

// An example wish for one occasion, built from the template's own sample data
// (nothing is saved). The home page links here so people can SEE what they will make.
const EXAMPLE_MEDIA = [
  { url: '/examples/ex1.svg', type: 'image' },
  { url: '/examples/ex2.svg', type: 'image' },
  { url: '/examples/ex3.svg', type: 'image' },
];
app.get('/example/:id', (req, res) => {
  const id = req.params.id;
  if (!inList(templates, id)) return res.status(404).render('not-found');
  const template = templates[id];
  const wish = {
    recipientName: 'Amina',
    senderName: 'Carlos',
    message: template.sampleMessage,
    bgColor: template.colors.bg,
    textColor: template.colors.text,
    media: EXAMPLE_MEDIA,
  };
  const trackFile = inList(tracks, template.music) ? tracks[template.music].file : null;
  res.render('wish', { wish, templateId: id, template, trackFile, isExample: true });
});

// The page the recipient opens.
app.get('/wish/:slug', (req, res) => {
  const wish = getWishBySlug(req.params.slug);
  if (!wish) return res.status(404).render('not-found');

  // Older wishes (made before templates existed) have no templateId: treat them as birthdays.
  const templateId = inList(templates, wish.templateId) ? wish.templateId : 'birthday';
  const template = templates[templateId];
  // The music file comes from OUR list, never straight from the saved data.
  const trackFile = inList(tracks, wish.track) ? tracks[wish.track].file : null;

  res.render('wish', { wish, templateId, template, trackFile, isExample: false });
});

// ---------- Error handling ----------
// Express calls this when something above throws or calls next(error),
// including multer errors (file too large, too many files, wrong type).
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, world!', time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `Each file must be smaller than ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES} files.`,
      LIMIT_UNEXPECTED_FILE: `You can upload at most ${MAX_FILES} files.`,
    };
    return res.status(400).json({ error: messages[err.code] || err.message });
  }
  if (err.message && err.message.startsWith('Only photos')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'That request could not be read.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Wish platform running at http://localhost:${PORT}`);
});
