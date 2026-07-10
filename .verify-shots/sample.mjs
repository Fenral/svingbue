import sharp from 'sharp';

const [,, imgPath, ptsJson] = process.argv;
const pts = JSON.parse(ptsJson); // [[x,y,label], ...]

function lum(r,g,b){
  const f = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const R=f(r),G=f(g),B=f(b);
  return 0.2126*R+0.7152*G+0.0722*B;
}
function contrastRatio(rgb1, rgb2){
  const L1 = lum(...rgb1), L2 = lum(...rgb2);
  const lighter = Math.max(L1,L2), darker = Math.min(L1,L2);
  return (lighter+0.05)/(darker+0.05);
}

const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function px(x,y){
  x = Math.max(0, Math.min(width-1, Math.round(x)));
  y = Math.max(0, Math.min(height-1, Math.round(y)));
  const idx = (y*width+x)*channels;
  return [data[idx], data[idx+1], data[idx+2]];
}

const results = pts.map(([x,y,label]) => ({ label, x, y, rgb: px(x,y) }));
console.log(JSON.stringify(results, null, 2));

// if pairs are named text:/bg: prefix, compute contrast between matching suffixes
const byKey = {};
for (const r of results) byKey[r.label] = r.rgb;
console.log('---CONTRASTS---');
for (const key of Object.keys(byKey)){
  if (key.startsWith('text:')){
    const suffix = key.slice(5);
    const bgKey = 'bg:'+suffix;
    if (byKey[bgKey]){
      console.log(suffix, contrastRatio(byKey[key], byKey[bgKey]).toFixed(2));
    }
  }
}
