const fs = require('fs');
for (const f of ['lemon-tea', 'strawberry-drink', 'gimbap', 'tiramisu', 'iced-coffee', 'matcha']) {
  const s = fs.readFileSync('images/' + f + '.svg', 'utf8');
  const m = s.match(/<image[^>]*?>/g) || [];
  console.log(f, 'size:', s.length, 'embedded images:', m.length, m.map(x => (x.match(/href="([^"]{0,24})/) || [])[1]));
}
