import type { Scene } from "@/lib/lesson-scenes"

type Point = [number, number]
type Hazard = "wire" | "car"
const skin = "#b87550"
const shirt = "#08746f"
const ink = "#23374a"
const wave = (t: number, seconds: number) => (1 - Math.cos(2 * Math.PI * t / seconds)) / 2
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const mix = (a: number, b: number, n: number) => a + (b - a) * n

function Arm({ shoulder: [x, y], hand: [hx, hy], bend, far = false }: {
  shoulder: Point; hand: Point; bend: number; far?: boolean
}) {
  const ex = (x + hx) / 2 + bend
  const ey = (y + hy) / 2 + Math.abs(bend) * 0.38
  return <g strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x} ${y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={far ? "#965e45" : skin} strokeWidth="12"/>
    <path d={`M${x} ${y} L${mix(x,ex,.48)} ${mix(y,ey,.48)}`} stroke={far ? "#155852" : shirt} strokeWidth="19"/>
    <path d={`M${hx+3} ${hy-2} q-5 -3 -9 0 l-6 3 q-2 4 4 4 h12 q5 -1 3 -5Z`} fill={far ? "#965e45" : skin}/>
  </g>
}

function Face() {
  // Left-facing profile with an ear, nose, jaw, hairline and tied hair.
  return <g>
    <path d="M-4 -22 Q-25 -24 -23 -5 l-4 9 5 2 q0 13 11 13 l4 9 16 -4 -4 -14 Q24 -19 -4 -22Z" fill={skin}/>
    <path d="M-24 -11 C-24 -38 18 -33 18 -9 Q19 5 10 11 L4 4 Q6 -10 -2 -6 L-5 -2 -7 -13 Q-15 -9 -24 -11Z" fill="#342d30"/>
    <circle cx="19" cy="-16" r="9" fill="#342d30"/><circle cx="1" cy="-2" r="4.5" fill={skin}/>
    <path d="M-21 -2 l4 1 M-21 10 l4 .5" stroke="#573b35" strokeWidth="1.7" strokeLinecap="round"/>
  </g>
}

function Rescuer({ hip, shoulder, hand, second, kneel, stride, bend, lean = 0 }: {
  hip: Point; shoulder: Point; hand: Point; second: Point; kneel: number; stride: number; bend: number; lean?: number
}) {
  const [x,y] = hip
  const [sx,sy] = shoulder
  const length = Math.hypot(sx-x, sy-y)
  const nx = (y-sy)/length
  const ny = (sx-x)/length
  const head: Point = [sx - 6 - lean * .35, sy - 26 + lean * .28]
  return <g>
    {[-1,1].map((side) => {
      const kx = x + mix(side*stride*.6,-19+side*11,kneel)
      const ky = mix((y+249)/2,245,kneel)
      const fx = x + mix(side*stride,41+side*12,kneel)
      const fy = 249 - Math.max(0,side*stride*.25)*(1-kneel)
      return <g key={side} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${x+side*5} ${y} L${kx} ${ky} L${fx} ${fy}`} fill="none" stroke={side<0?"#243749":"#375169"} strokeWidth="23"/>
        <path d={`M${fx-3} ${fy-3} l9 0 5 7 h-23 q-2 -5 9 -7Z`} fill="#192f3d"/>
      </g>
    })}
    <Arm shoulder={[sx-5,sy+2]} hand={second} bend={bend-3} far/>
    <path d={`M${sx-nx*14} ${sy-ny*14} Q${sx+(sx-x)*.24} ${sy+(sy-y)*.24} ${sx+nx*17} ${sy+ny*17} L${x+nx*17} ${y+ny*17} Q${x+8} ${y+10} ${x-nx*15} ${y-ny*15}Z`} fill={shirt}/>
    <path d={`M${head[0]} ${head[1]+10} L${sx} ${sy-4}`} stroke={skin} strokeWidth="12"/>
    <g transform={`translate(${head}) rotate(${-lean})`}><Face/></g>
    <Arm shoulder={shoulder} hand={hand} bend={bend}/>
  </g>
}

function Adult({ rise, tilt, responds }: { rise: number; tilt: number; responds: number }) {
  return <g>
    <path d="M357 224 Q397 219 444 226 l66 6 11 12 -77 -1 -78 4Z" fill="#424760"/>
    <path d="M351 229 Q387 224 425 231 l69 8 10 10 -85 -2 -66 2Z" fill="#57627b"/>
    <path d="M495 236 l9 -3 4 -12 q8 -3 13 15 l3 12 -30 1Z" fill="#563e36"/>
    <path d={`M201 222 Q221 218 233 212 Q264 ${198-rise} 298 ${209-rise} Q327 217 369 222 L375 246 Q288 252 217 241Z`} fill="#c36843"/>
    <path d="M180 220 Q197 215 218 221 l-1 11 -32 1Z" fill="#ca936e"/>
    <g transform={`rotate(${tilt} 202 224) translate(0 ${-responds*5})`}>
      <path d="M145 226 Q132 208 150 198 Q158 194 164 195 l9 -9 4 7 9 -1 7 6 q13 5 10 17 l-5 12 Q169 239 145 226Z" fill="#dba17b"/>
      <path d="M143 228 Q129 220 135 205 q2 -11 19 -14 l11 4 -7 7 q-12 5 -7 13 l8 4 -7 9Z" fill="#534544"/>
      <path d="M158 199 q4 3 7 0 M184 195 l4 4" stroke="#785142" fill="none" strokeWidth="2"/>
      <ellipse cx="162" cy="218" rx="5" ry="4" fill="#ca916f"/>
    </g>
    <path d={`M229 231 Q252 244 274 ${244-responds*11} L${314-responds*10} ${244-responds*40}`} stroke="#ce946e" fill="none" strokeWidth="12" strokeLinecap="round"/>
    <path d="M224 221 q14 -2 30 11 l-8 12 q-24 -4 -22 -23Z" fill="#aa5036"/>
  </g>
}

function Mask({ y }: {y:number}) {
  return <g transform={`translate(174 ${y}) rotate(-12)`}>
    <path d="M-15 2 Q-14 -8 -7 -10 l12 -3 q9 0 16 14 Q8 9 -15 2Z" fill="#adede8" stroke="#247774" strokeWidth="2"/>
    <path d="M-1 -10 v-7 h7 v7" fill="#def9f7" stroke="#247774" strokeWidth="2"/>
  </g>
}

interface Props {
  scene: Scene; time: number; alternate: boolean; callState: number
  hazards: Hazard[]; onHazard: (hazard: Hazard) => void; labels: Record<Hazard,string>; description: string; units: [string,string]
}

export function LessonIllustration({scene,time:t,alternate,callState,hazards,onHazard,labels,description,units}: Props) {
  const phase = t % 6
  const approach = scene === "approach"
  const walking = approach ? clamp(phase / 3) : 1
  const knee = approach ? clamp((phase-3)/1.4) : scene === "hazards" ? 0 : scene === "kneel" ? clamp(phase/2) : 1
  const hx = scene === "hazards" ? 461 : mix(485,338,walking)
  const hy = mix(145,205,knee)
  const trainedReturn = scene === "resume" && !alternate && phase < 4
  const press = scene === "press" || (scene === "resume" && !trainedReturn)
  const dip = press ? wave(t,60/110)*8 : 0
  const mask = scene === "barrier" || scene === "breaths" || trainedReturn
  const airway = scene === "airway" || mask || scene === "breathing"
  const normal = scene === "breathing" || (scene === "gasp" && alternate)
  const breathe = normal ? wave(t,3.4)*8 : scene === "gasp" ? (phase < .55 ? wave(phase,.55)*5 : 0) : (scene === "breaths" || trainedReturn) && phase < 4 ? wave(phase,2)*9 : 0
  const compareBent = scene==="alignment" && alternate
  const lean = airway ? 47 : scene === "tap" || scene === "response" ? 18 : 0
  const shoulder: Point = mask ? [213,184-wave(t,2)*7] : airway ? [216 + wave(t,3)*4,148+wave(t,3)*5] : [mix(hx,compareBent ? 312 : 267,knee),mix(78,129+dip+(scene==="alignment"?wave(t,1.4)*6:0),knee)]
  let hand: Point = [266,205+dip]
  let second: Point = [269,199+dip]
  if (scene==="tap" || scene==="response") {
    hand = [235,212 - wave(t,1.25)*10]; second = [243,210]
  } else if (airway) {
    hand = [190,195-wave(t,3)*3]; second=[156,194]
  } else if (scene==="hazards" || approach || scene==="kneel") {
    hand=scene==="hazards"?[hx-26,91+wave(t,3)*18]:[hx-24,hy+9]; second=[hx+14,hy+5]
  } else if (scene==="call") {
    hand=[240,151+wave(t,2)*3]; second=[260-wave(t,2)*8,172-wave(t,2)*10]
  } else if (scene==="bystander" || scene==="aed") {
    hand=[324,141-wave(t,2)*5]; second=[303,169]
  } else if (scene==="hands") {
    second=[269+wave(t,3)*20,200-wave(t,3)*24]
  }
  const crop = airway ? "100 65 348 191" : scene==="press" || scene==="alignment" || scene==="hands" ? "122 44 370 205" : "0 0 600 280"
  function hazard(id: Hazard, art: React.ReactNode) {
    return <g role="button" tabIndex={0} aria-label={labels[id]} aria-pressed={hazards.includes(id)} className="cursor-pointer"
      onClick={()=>onHazard(id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onHazard(id)}}}>
      {art}
    </g>
  }
  return <svg viewBox={crop} className="block w-full rounded-xl bg-[#e8f2ee]" role={scene==="hazards"?"group":"img"} aria-label={description}>
    <path fill="#d4e5de" d="M0 110 l48 -22 42 9 61 -22 70 34 83 -31 70 24 59 -22 80 23 87 -30 v207 H0Z"/>
    <path fill="#c1d7cf" d="M0 183 q130 -30 260 0 t340 -8 v105 H0Z"/>
    <path fill="#f5e6d2" d="M0 215 Q251 191 600 206 V280 H0Z"/>
    <path stroke="#c7ae95" d="M0 255 H600"/>
    {scene==="hazards" && <>
      {hazard("car",<g transform={`translate(${26+wave(t,4)*25} 109)`}>
        <rect x="-8" y="-10" width="154" height="68" rx="12" fill={hazards.includes("car")?"#c0ece5":"transparent"} stroke="#98744d" strokeDasharray="4 4"/>
        <path fill="#ad4c36" d="M0 28 l22 -6 19 -21 h43 l25 20 18 4 q6 3 5 15 H0Z"/><path fill="#d0e9e7" d="M32 20 44 5 h17 v15Z M67 5 h15 l18 15 H67Z"/>
        <circle cx="25" cy="39" r="10" fill={ink}/><circle cx="108" cy="39" r="10" fill={ink}/>
      </g>)}
      {hazard("wire",<g><rect x="43" y="176" width="81" height="58" rx="9" fill={hazards.includes("wire")?"#c0ece5":"#f3e5ce"} stroke="#98744d" strokeDasharray="4 4"/><path d="M49 184 q30 0 12 20 t29 5" fill="none" stroke={ink} strokeWidth="5"/><path d={`M92 205 l9 -9 -2 8 12 -4 -13 13 2 -8Z`} fill="#b65b06" opacity={.5+wave(t,.9)*.5}/></g>)}
    </>}
    <ellipse cx="328" cy="249" rx="200" ry="6" fill="#c1ab92" opacity=".65"/>
    <Rescuer hip={[airway?289:hx,airway?195:hy]} shoulder={shoulder} hand={hand} second={second} kneel={knee}
      stride={approach?(1-walking)*Math.sin(t*7)*24:10} bend={compareBent?30:airway?9:press?0:6} lean={lean}/>
    <Adult rise={breathe-dip} tilt={airway?-8*clamp(phase):0} responds={scene==="response" && alternate?wave(t,2.5):0}/>
    {/* Forearms and hands overlap the patient's chest and shoulder. */}
    {knee>.8 && <><Arm shoulder={[shoulder[0]-5,shoulder[1]]} hand={second} bend={compareBent?34:airway?9:3} far/>
      <Arm shoulder={shoulder} hand={hand} bend={compareBent?32:airway?9:press?0:6}/></>}
    {scene==="tap" && <path d="M229 121 q-7 5 -4 12 m-4 -16 q-11 8 -7 20" fill="none" stroke={shirt} strokeWidth="3" opacity={wave(t,1.2)}/>}
    {scene==="call" && <g transform={`translate(226 ${120+wave(t,2)*3}) rotate(-9)`}><rect width="24" height="39" rx="5" fill={ink}/><rect x="3" y="5" width="18" height="26" rx="2" fill={callState?"#8ce4c0":"#dae9e5"}/><path d="M29 8 q9 9 0 18 m6 -23 q15 15 0 29" fill="none" stroke={shirt} strokeWidth="3" opacity={callState===2?wave(t,1):0}/></g>}
    {scene==="bystander" && <g transform={`translate(${mix(175,50,wave(t,6))} 31) scale(.78)`}>
      <Rescuer hip={[42,145]} shoulder={[45,88]} hand={[24,151]} second={[62,148]} kneel={0} stride={18*Math.sin(t*5)} bend={8}/>
      <rect x="6" y="153" width="40" height="29" rx="5" fill="#b54530"/><text x="26" y="173" fill="white" textAnchor="middle" fontSize="12">AED</text>
    </g>}
    {scene==="aed" && <g transform="translate(36 23)">
      <rect width="158" height="146" rx="14" fill="#fffaf1"/><path d="M48 23 q16 7 27 -1 l17 5 12 17 -8 17 -7 -7 -3 60 H37 l-1 -60 -8 8 -8 -15 14 -18Z" fill="#dca582"/>
      <g opacity={.25+.75*clamp(phase)} fill="#fff9de" stroke="#365e59" strokeWidth="2"><rect x="40" y="40" width="16" height="23" rx="4" transform="rotate(-12 48 50)"/><rect x="78" y="68" width="15" height="24" rx="4" transform="rotate(14 85 80)"/></g>
      <path d="M47 61 Q29 131 110 109 M86 91 Q94 114 114 106" fill="none" stroke={ink}/><rect x="108" y="88" width="39" height="38" rx="5" fill={shirt}/><text x="127" y="110" textAnchor="middle" fill="white" fontSize="12">AED</text>
      <path d="M133 75 q5 3 3 9 m1 -14 q9 4 6 15" fill="none" stroke={shirt} strokeWidth="2" opacity={wave(t,1)}/>
    </g>}
    {mask && <Mask y={scene==="barrier"?193-14*(1-clamp(phase)):193}/>}
    {(scene==="breaths" || trainedReturn) && <path d="M184 153 Q166 163 176 177" stroke="#258a9b" strokeDasharray="3 3" fill="none" strokeWidth="3" opacity={breathe/9}/>}
    {scene==="hands" && <g transform="translate(376 60)">
      <rect width="107" height="108" rx="9" fill="#fff9ee"/>
      <path d="M38 9q13 8 26 0l16 7 12 22 -12 8 -6 -10 -3 63 H27l-3 -63 -7 10 -12 -9 14 -22Z" fill="#dfaa84"/>
      <path d="M49 28v37" stroke="#a86c51" strokeWidth="3"/>
      <ellipse cx="49" cy="56" rx="9" ry="8" fill="none" stroke="#17776e" strokeDasharray="2 2"/>
      <path d="M97 78 59 65 q-11 -2 -18 -7 q-5 -6 3 -8 l17 5 38 9Z" fill="#bd7853" stroke="#75462e"/>
      <g transform={`translate(${wave(t,3)*8} ${-wave(t,3)*18})`}><path d="M101 69 66 58 49 49 q-8 -3 -9 2 q-2 4 5 7 l17 8 36 14Z" fill="#cf926b" stroke="#75462e"/></g>
    </g>}
    {scene==="press" && <g transform="translate(397 115)" fill={ink} fontSize="12"><path d="M0 8v35 m-4 -35 h8 m-8 35 h8" fill="none" stroke={ink}/><circle cy={8+dip*4} r="3" fill="#b64a35"/><text x="9" y="30">{units[0]}</text><text x="-17" y="62">{units[1]}</text></g>}
  </svg>
}
