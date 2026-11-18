/*
  TEMPLATES: the list of occasions people can create a wish for.

  This is only data. Nothing here runs. Other files read it with
  require('./templates'), and each key (birthday, graduation, ...) is the
  template's id, which appears in web addresses like /create/birthday.

  What each field does:
    name, emoji, tagline  shown on the occasion cards on the home page
    colors                the starting background + text colors (the sender can change them)
    sampleMessage         the message the builder starts with
    suggestions           extra message ideas the sender can click (EN = English, SW = Swahili)
    coverLine             the small line above the name on the wish cover
    signOff               the line before the sender's name ("With love,")
    icon                  the picture on the cover: 'gift' | 'heart' | 'cap' | 'flower'
    decoration            the party decoration + confetti style:
                          'bunting' | 'hearts' | 'stars' | 'flowers'
    music                 the id of the default track (see tracks.js)

  To add an occasion later, add another entry below. The home page, the
  builder and the wish page all read this list, so nothing else needs to change.
  (A new icon or decoration also needs a few lines in wish.ejs / wish.css.)
*/

module.exports = {
  birthday: {
    name: 'Birthday',
    emoji: '🎂',
    tagline: 'Make their day unforgettable',
    colors: { bg: '#ffe4e1', text: '#4a2c3d' },
    sampleMessage: 'Happy Birthday! Wishing you a year full of joy.',
    suggestions: [
      { lang: 'EN', text: 'Happy Birthday! Wishing you a year full of joy, laughter and everything you wish for.' },
      { lang: 'EN', text: 'Another year older, another year better. Enjoy every moment of your special day!' },
      { lang: 'SW', text: 'Heri ya siku ya kuzaliwa! Mungu akupe afya njema, furaha na mafanikio mwaka mzima.' },
      { lang: 'SW', text: 'Hongera kwa siku yako maalum! Nakutakia maisha marefu yenye baraka na upendo.' },
    ],
    coverLine: 'A birthday surprise for',
    signOff: 'With love,',
    icon: 'gift',
    decoration: 'bunting',
    music: 'birthday',
  },

  anniversary: {
    name: 'Anniversary',
    emoji: '💕',
    tagline: 'Celebrate your love story',
    colors: { bg: '#ffd9e4', text: '#5a1f3a' },
    sampleMessage: 'Happy anniversary, my love. Every day with you is my favorite day.',
    suggestions: [
      { lang: 'EN', text: 'Happy anniversary, my love. Every day with you is my favorite day.' },
      { lang: 'EN', text: 'Thank you for loving me, for every laugh and every memory. Here is to many more years together.' },
      { lang: 'SW', text: 'Heri ya maadhimisho yetu, mpenzi wangu. Kila siku nikiwa nawe ni siku bora kwangu.' },
      { lang: 'SW', text: 'Nakupenda leo kuliko jana, na kesho kuliko leo. Heri ya maadhimisho!' },
    ],
    coverLine: 'A love note for',
    signOff: 'Forever yours,',
    icon: 'heart',
    decoration: 'hearts',
    music: 'love',
  },

  graduation: {
    name: 'Graduation',
    emoji: '🎓',
    tagline: 'Celebrate a big achievement',
    colors: { bg: '#e8f0ff', text: '#1d2b4f' },
    sampleMessage: 'Congratulations, graduate! You earned every bit of this.',
    suggestions: [
      { lang: 'EN', text: 'Congratulations, graduate! All your hard work has paid off, and we are so proud of you.' },
      { lang: 'EN', text: 'You did it! The best chapter is just beginning. Congratulations!' },
      { lang: 'SW', text: 'Hongera kwa kuhitimu! Juhudi zako zimezaa matunda, na tunajivunia sana.' },
      { lang: 'SW', text: 'Hongera sana! Safari mpya ya mafanikio inaanza leo. Mungu akuongoze.' },
    ],
    coverLine: 'Congratulations to',
    signOff: 'Proudly yours,',
    icon: 'cap',
    decoration: 'stars',
    music: 'celebrate',
  },

  thankyou: {
    name: 'Thank You',
    emoji: '🌸',
    tagline: 'Say thanks in a way they will keep',
    colors: { bg: '#e6f6ea', text: '#23422f' },
    sampleMessage: 'Thank you for everything you do. It means more than words can say.',
    suggestions: [
      { lang: 'EN', text: 'Thank you for everything you do. It means more than words can say.' },
      { lang: 'EN', text: 'Your kindness has not gone unnoticed. Thank you from the bottom of my heart.' },
      { lang: 'SW', text: 'Asante sana kwa kila ulichonifanyia. Shukrani zangu hazina kikomo.' },
      { lang: 'SW', text: 'Asante kwa wema wako. Mungu akubariki sana.' },
    ],
    coverLine: 'A thank you for',
    signOff: 'With gratitude,',
    icon: 'flower',
    decoration: 'flowers',
    music: 'grateful',
  },
};
