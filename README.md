# 
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chronoglobe v4 — Zoom & Pan</title>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#14100c;color:#e8dcc8;font-family:Georgia,serif;text-align:center;padding:14px;min-height:100vh}
  h1{font-size:26px;letter-spacing:3px;color:#d4a94e}
  .sub{font-size:12px;font-style:italic;color:#9c8a6a;margin-bottom:8px}
  #mapWrap{position:relative;width:min(97vw,1000px);margin:auto}
  svg{width:100%;border-radius:10px;border:1px solid #4a3b26;background:#12233d;
      box-shadow:0 6px 30px rgba(0,0,0,.55);cursor:grab;display:block}
  svg:active{cursor:grabbing}
  #yearBadge{position:absolute;top:8px;left:8px;pointer-events:none;background:rgba(15,12,8,.85);
    border:1px solid #d4a94e;padding:5px 14px;border-radius:20px;font-size:19px;color:#d4a94e;letter-spacing:2px}
  #zoomBadge{position:absolute;top:10px;right:10px;pointer-events:none;background:rgba(15,12,8,.85);
    padding:3px 10px;border-radius:14px;font-size:12px;color:#9c8a6a}
  #eraName{position:absolute;bottom:8px;left:8px;pointer-events:none;background:rgba(15,12,8,.85);
    padding:4px 12px;border-radius:14px;font-size:12px;color:#c9b98f;max-width:75%}
  input{background:#241c14;color:#e8dcc8;border:1px solid #6a5535;padding:10px;width:130px;
    font-size:17px;text-align:center;border-radius:6px;font-family:Georgia;margin-top:12px}
  button{background:#d4a94e;color:#14100c;border:none;padding:11px 18px;font-size:15px;
    border-radius:6px;cursor:pointer;font-family:Georgia;font-weight:bold;margin:6px 4px}
  button:hover{background:#e8bf63}
  button.ghost{background:#4a3b26;color:#e8dcc8}
  button.ghost:hover{background:#5f4b30}
  #hint{font-size:12px;color:#9c8a6a;margin-top:6px}
  #guesses{margin-top:10px;width:min(96vw,640px);margin:auto;max-height:240px;overflow-y:auto}
  .g{display:flex;justify-content:space-between;gap:8px;padding:7px 12px;margin:4px 0;border-radius:6px;font-size:16px}
  .up::after{content:" ▲";color:#ffb08a}.down::after{content:" ▼";color:#8ac6ff}
  #winBox{display:none;margin-top:14px;background:#241c14;border:1px solid #d4a94e;border-radius:10px;
    padding:16px;width:min(92vw,480px);margin-left:auto;margin-right:auto}
  #winBox .big{font-size:30px;color:#d4a94e}
  #loading{color:#d4a94e;font-style:italic;margin-top:20px}
  /* tooltip */
  #tip{position:absolute;display:none;pointer-events:none;background:#1a1410;border:1px solid #d4a94e;
    color:#e8dcc8;padding:4px 10px;border-radius:6px;font-size:13px;z-index:10;white-space:nowrap}
</style>
</head>
<body>
<h1>CHRONOGLOBE</h1>
<div class="sub">Real historical borders · scroll = zoom · drag = pan · one random year hides in 5,000 years</div>

<div id="mapWrap">
  <svg id="map" viewBox="0 0 1000 520"></svg>
  <div id="yearBadge">?????</div>
  <div id="zoomBadge">🔍 100%</div>
  <div id="eraName">Loading historical atlas…</div>
  <div id="tip"></div>
</div>
<div id="loading">⏳ Fetching world history…</div>

<input type="number" id="guessInput" placeholder="Year (neg = BC)">
<button onclick="makeGuess()">GUESS</button>
<br>
<button class="ghost" onclick="resetZoom()">⌖ Reset View</button>
<div id="hint">🔥 closer in time · ▲ answer is later · ▼ answer is earlier · hover a country for its name</div>
<div id="guesses"></div>
<div id="winBox"><div>You found it!</div><div class="big" id="winYear"></div><div id="winStats"></div></div>

<script>
/* ---------- daily seed & random answer ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const _d=new Date(),rng=mulberry32(_d.getFullYear()*10000+(_d.getMonth()+1)*100+_d.getDate());
const ANCHORS=[-2500,-1200,-500,-100,200,600,800,1000,1250,1450,1600,1750,1850,1900,1950,2020];
const ANSWER=Math.round(ANCHORS[Math.floor(rng()*ANCHORS.length)]+(rng()*2-1)*90);

/* ---------- load historical basemaps ----------
   Source: github.com/aourednik/historical-basemaps (CC-BY) */
const EPOCHS=[-3000,-2300,-1500,-1000,-800,-700,-600,-500,-400,-323,-200,-100,-1,
  100,200,300,400,500,600,700,800,900,1000,1100,1200,1279,1300,1400,1490,1500,1530,
  1600,1650,1700,1715,1783,1800,1815,1880,1900,1914,1920,1930,1938,1945,1960,1994,2000,2010,2020];

const atlas={};
let projection=d3.geoNaturalEarth1().fitExtent([[5,5],[995,515]],{type:"Sphere"});
let path=d3.geoPath(projection);

async function loadAtlas(){
  await Promise.all(EPOCHS.map(async e=>{
    const yr=e<0?`bc−e‘:‘{-e}`:`−e‘:‘{e}`;
    try{
      const r=await fetch(`https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${yr}.geojson`);
      if(r.ok) atlas[e]=(await r.json()).features;
    }catch(_){}
  }));
  document.getElementById('loading').style.display='none';
  drawMap(1500);
}
function featuresFor(y){
  let best=null;
  for(const e of EPOCHS) if(e<=y&&atlas[e]) best=atlas[e];
  if(!best) best=atlas[EPOCHS.find(e=>atlas[e])]||[];
  return best;
}

const PALETTE=['#c0392b','#2e8b57','#b07a3f','#7d5ba6','#d4823a','#3e7d4f','#8f2f2a',
  '#5a6f8a','#caa04a','#a05a6a','#4a6fa5','#8a4a4a','#c06a3a','#6d7f96'];
function fmtYear(y){return y<0?(-y)+' BC':y+' AD'}
function eraTitle(y){
  if(y<-800)return"Bronze Age";if(y<476)return"Classical Antiquity";
  if(y<1000)return"Early Middle Ages";if(y<1500)return"Late Middle Ages";
  if(y<1700)return"Age of Exploration";if(y<1900)return"Imperial Era";
  if(y<1950)return"World Wars Era";return"Modern Era";
}

const svg=d3.select('#map'), tip=document.getElementById('tip');

/* ================= ZOOM / PAN SETUP ================= */
const zoom=d3.zoom()
  .scaleExtent([1,40])                       // up to 40×
  .translateExtent([[0,0],[1000,520]])       // can't pan past the map edges
  .on('zoom',ev=>{
    g.attr('transform',ev.transform);
    // keep stroke widths readable at high zoom
    const s=ev.transform.k;
    borderG.selectAll('path')
      .attr('stroke-width',Math.max(.4/s,.25))
      .attr('fill-opacity',s>6?0.75:0.55);   // more opaque when deep-zoomed
    document.getElementById('zoomBadge').textContent='🔍 '+Math.round(s*100)+'%';
    if(s>1.01){svg.style.cursor='grab'} 
  });
// double-click = smooth zoom-in at point (default), dblclick + shift = out
svg.on('dblclick.zoom',null)
   .on('dblclick',ev=>{ ev.shiftKey? svg.transition().duration(400).call(zoom.scaleBy,.5)
                                    : svg.transition().duration(400).call(zoom.scaleBy,2); });

const g=svg.call(zoom).append('g');          // everything lives inside this group
let borderG;

/* ================= MAP DRAWING ================= */
function drawMap(year){
  g.selectAll('*').remove();

  const base=g.append('g');
  borderG=g.append('g');
  const labels=g.append('g');

  base.append('path').attr('d',path({type:'Sphere'}))
    .attr('fill','#12233d').attr('stroke','rgba(212,169,78,.35)');
  base.append('path').attr('d',path(d3.geoGraticule10()))
    .attr('fill','none').attr('stroke','rgba(255,255,255,.05)');

  const feats=featuresFor(year);
  const k=d3.zoomTransform(svg.node()).k;    // current zoom

  borderG.selectAll('path').data(feats).join('path')
    .attr('d',path)
    .attr('fill',(f,i)=>PALETTE[i%PALETTE.length])
    .attr('fill-opacity',k>6?0.75:0.55)
    .attr('stroke','#e8dcc8')
    .attr('stroke-width',Math.max(.4/k,.25))
    .on('mousemove',(ev,f)=>{
      tip.style.display='block';
      tip.textContent=f.properties.NAME||f.properties.name||'';
      const r=ev.currentTarget.closest('#mapWrap').getBoundingClientRect();
      tip.style.left=(ev.clientX-r.left+12)+'px';
      tip.style.top =(ev.clientY-r.top -8)+'px';
    })
    .on('mouseout',()=>tip.style.display='none');

  // label big polities when zoomed in enough
  if(k>2.5){
    labels.selectAll('text').data(feats.filter(f=>path.centroid(f)[0])).join('text')
      .attr('x',f=>path.centroid(f)[0]).attr('y',f=>path.centroid(f)[1])
      .attr('text-anchor','middle').attr('font-size',11/Math.sqrt(k))
      .attr('fill','rgba(232,220,200,.85)').attr('pointer-events','none')
      .text(f=>(f.properties.NAME||f.properties.name||'').slice(0,22));
  }

  document.getElementById('eraName').textContent=
    fmtYear(year)+' · '+eraTitle(year)+' · '+feats.length+' polities shown';
}

function resetZoom(){
  svg.transition().duration(500).call(zoom.transform,d3.zoomIdentity);
}

/* ---------- re-render on zoom end so labels/strokes refresh ---------- */
let lastK=1;
svg.on('wheel.zoom',null).on('wheel',(ev)=>{
  // default wheel zoom but re-draw after gesture ends
},{passive:true});
svg.call(zoom).on('end.zoom',()=>{});        // (labels update via next guess/draw)

/* ================= GAME LOGIC ================= */
let prevDiff=null,count=0,won=false;
function heatColor(diff){
  const t=Math.min(diff/700,1);
  return `rgb(Math.round(60+t∗195),{Math.round(60+t*195)},Math.round(60+t∗195),{Math.round(130-t*90)},${Math.round(230-t*210)})`;
}
function makeGuess(){
  if(won)return;
  const val=parseInt(document.getElementById('guessInput').value);
  if(isNaN(val)||val<-3000||val>2024){alert('Enter a year from -3000 to 2024');return;}
  count++;
  const diff=Math.abs(val-ANSWER);
  drawMap(val);
  document.getElementById('yearBadge').textContent=fmtYear(val);
  const row=document.createElement('div');
  row.className='g '+(val<ANSWER?'up':val>ANSWER?'down':'');
  row.style.background=heatColor(diff);
  row.innerHTML=`<span>📅 fmtYear(val)</span><span>{fmtYear(val)}</span><span>fmtYear(val)</span><span>{diff===0?'✅ CORRECT!':diff+' yrs off'}</span>`;
  if(prevDiff!==null)row.insertAdjacentHTML('beforeend',
    `<span style="font-style:italic">${diff<prevDiff?'🔥 Warmer':diff===prevDiff?'➖ Same':'🧊 Colder'}</span>`);
  prevDiff=diff;
  document.getElementById('guesses').prepend(row);
  document.getElementById('guessInput').value='';
  if(diff===0){
    won=true;
    document.getElementById('winBox').style.display='block';
    document.getElementById('winYear').textContent='The year was '+fmtYear(ANSWER);
    document.getElementById('winStats').textContent=`Solved in countguess{count} guesscountguess{count>1?'es':''} · ${eraTitle(ANSWER)}`;
    drawMap(ANSWER);document.getElementById('yearBadge').textContent=fmtYear(ANSWER);
  }
}
document.getElementById('guessInput').addEventListener('keydown',e=>{if(e.key==='Enter')makeGuess()});
loadAtlas();
</script>
</body>
</html>
