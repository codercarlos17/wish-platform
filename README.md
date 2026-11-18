# Wish Platform

Create a personal, decorated greeting page, then share its private link on WhatsApp.

## Flow
1. Home page (`/`): choose an occasion (Birthday, Anniversary, Graduation, Thank You). Each card has "See an example".
2. Builder (`/create/<occasion>`): colors, a sample message, message ideas (English + Swahili) and music are pre-filled. Change anything, add photos/videos, press Create.
3. Share the link (`/wish/<id>`). The receiver taps "Open Surprise": music starts (with a mute button), confetti, card opens.
4. "Don't see your occasion?" box on the home page saves requests to `data/requests.json`.

## Run
    npm install
    npm start            # http://localhost:3000   (PORT=3001 npm start to change)

## Where things live
| File | Job |
|---|---|
| `server.js` | Routes, validation, uploads |
| `store.js` | Saves wishes/requests in JSON files (the only file to replace when moving to a database) |
| `templates.js` | The occasions: colors, texts, ideas, decoration, music |
| `tracks.js` | The list of music files |
| `views/wish.ejs` | The wish page |
| `public/` | Pages, CSS, JS, fonts, `music/`, `examples/` |

Add an occasion: add an entry to `templates.js`; its card appears on the home page by itself.
Add a song: put an mp3 in `public/music/` and add a line in `tracks.js`.

## Security notes
- Users never choose file paths: occasion and music are checked against the server's own lists.
- User text is always escaped (`<%= %>`, `textContent`). Uploads: image/video types only, 10 files, 50 MB each, random file names.
- Notes to the request box: 5 per hour per IP.

## Licensing
The four music tracks were synthesized for this project (original). Only the "Happy Birthday" melody is an old traditional tune. Fonts (Dancing Script, Caveat, Nunito) are SIL OFL.

## Known limits (V1)
- JSON-file storage and local `uploads/` folder: fine for testing, not for many users. Next: Postgres (Prisma) + cloud storage.
- Free hosts with temporary disks will lose uploads on restart.
- WhatsApp link preview (og:image) not added yet.
