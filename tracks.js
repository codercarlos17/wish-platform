/*
  TRACKS: the background music a sender can choose.

  Like templates.js, this is only data. The server checks every track id it
  receives against THIS list (never a file path from the browser), so nobody
  can make a wish play some other file.

  The four files in public/music/ were synthesized for this project (no
  recordings, no samples), so there is nothing to license. Only "Happy
  Birthday" is an existing tune: its melody is very old and generally treated
  as public domain, and this recording of it is original.

  To use your own music later: copy an .mp3 into public/music/ and add a line
  here. Only use music you made or are licensed to use. Keep files around 1 MB
  (30 to 60 seconds, mono, 80 to 96 kbps) because many viewers are on mobile data.
*/

module.exports = {
  birthday:  { name: 'Happy Birthday (music box)', file: '/music/birthday.mp3' },
  love:      { name: 'Soft Love (music box)',      file: '/music/love.mp3' },
  celebrate: { name: 'Celebrate (marimba)',        file: '/music/celebrate.mp3' },
  grateful:  { name: 'Grateful (soft keys)',       file: '/music/grateful.mp3' },
};
