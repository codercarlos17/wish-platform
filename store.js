/*
  STORE: where wishes are saved and loaded.

  For now it is a single JSON file (data/wishes.json), so the project
  runs with zero setup. Nothing outside this file knows HOW wishes are
  stored, only that it can call createWish() and getWishBySlug().

  Later, when we move to PostgreSQL + Prisma, we rewrite ONLY this file.
  server.js and the pages stay the same. That is the point of keeping
  storage in its own module.

  A "wish" looks like:
  {
    slug: "a1b2c3d4",          // the random part of /wish/a1b2c3d4
    recipientName, senderName, message,
    bgColor: "#ffe4e1", textColor: "#333333",
    templateId: "birthday",    // which occasion (a key of templates.js)
    track: "birthday",         // which music (a key of tracks.js), or "" for none
    media: [{ url: "/uploads/xyz.jpg", type: "image" | "video" }],
    createdAt: "2026-11-18T08:00:00.000Z"
  }

  It also keeps the "request an occasion" notes people send (data/requests.json),
  so you can see which occasions to build next.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wishes.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

// Make sure the folder and file exist before we try to read them.
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]');

function readAll() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAll(wishes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2));
}

// 8 random hex characters, e.g. "9f3a1c7e". Random so links can't be guessed
// by counting (/wish/1, /wish/2 would let anyone browse every wish).
function makeSlug() {
  return crypto.randomBytes(4).toString('hex');
}

function createWish(data) {
  const wishes = readAll();

  // Extremely unlikely, but make sure the slug is not already taken.
  let slug = makeSlug();
  while (wishes.some((w) => w.slug === slug)) slug = makeSlug();

  const wish = { slug, ...data, createdAt: new Date().toISOString() };
  wishes.push(wish);
  writeAll(wishes);
  return wish;
}

function getWishBySlug(slug) {
  return readAll().find((w) => w.slug === slug) || null;
}

// Save one "please add this occasion" note. Returns false when the list is full
// (a simple guard so the file cannot grow forever).
const MAX_REQUESTS = 1000;
function addRequest(text) {
  const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
  if (requests.length >= MAX_REQUESTS) return false;
  requests.push({ text, createdAt: new Date().toISOString() });
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
  return true;
}

module.exports = { createWish, getWishBySlug, addRequest };
