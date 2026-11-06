const fs = require('fs');
const html = fs.readFileSync('public/paratharoll/Malai + Tikka Paratha Roll.htm', 'utf8');

const ytMatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|webp)/g);
if (ytMatches) {
  console.log('Unique image URLs found:', [...new Set(ytMatches)].slice(0, 10));
} else {
  console.log('No jpg/webp matches found');
}
