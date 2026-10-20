// Sinh bố cục B mùa xuân bằng crop/copy nguyên kích thước từ sheet Stardew.
import { writeFileSync } from "node:fs";
import { dirtTiles, fillRect, ring } from "./autotile.ts";
const T = 16, W = 80, H = 48;
type Layer = "ground" | "paths" | "fences" | "buildings" | "decor";
type Src = { sheet: string; x: number; y: number; w: number; h: number };
type Placement = { sheet: string; src: { x: number; y: number; w: number; h: number }; dest: { x: number; y: number }; layer: Layer; z: number; repeat?: { cols: number; rows: number } };
const crop = (sheet: string, x: number, y: number, w: number, h: number): Src => ({ sheet: `sv-${sheet}`, x, y, w, h });
const fills: object[] = [];
const placements: Placement[] = [];
const objects: { id: string; name: string; target: string; z: number; focus: { x: number; y: number }; bounds: { x: number; y: number; w: number; h: number }; placements: Placement[] }[] = [];
function place(list: Placement[], s: Src, x: number, y: number, layer: Layer, z: number) {
  // Boundary trees retain only the visible source rectangle; no pixels are altered.
  const left = Math.max(0, -x), top = Math.max(0, -y);
  const w = Math.min(s.w - left, W * T - Math.max(0, x));
  const h = Math.min(s.h - top, H * T - Math.max(0, y));
  if (w > 0 && h > 0) list.push({ sheet: s.sheet, src: { x: s.x + left, y: s.y + top, w, h }, dest: { x: Math.max(0, x), y: Math.max(0, y) }, layer, z });
}
function building(id: string, name: string, target: string, z: number, draw: (list: Placement[]) => void) {
  const list: Placement[] = [];
  draw(list);
  const x = Math.min(...list.map((p) => p.dest.x)), y = Math.min(...list.map((p) => p.dest.y));
  const bounds = { x, y, w: Math.max(...list.map((p) => p.dest.x + p.src.w)) - x, h: Math.max(...list.map((p) => p.dest.y + p.src.h)) - y };
  objects.push({ id, name, target, z, focus: { x: x + bounds.w / 2, y: y + bounds.h / 2 }, bounds, placements: list });
}
const decor = (s: Src, x: number, y: number) => place(placements, s, x, y, "decor", 40);
const grass = crop("spring-outdoors", 0, 112, T, T);
fills.push({ id: "grass", sheet: grass.sheet, src: { x: grass.x, y: grass.y, w: T, h: T }, area: { x: 0, y: 0, w: W*T, h: H*T }, step: { x: T, y: T }, layer: "ground", z: 0 });
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const n = (x * 7 + y * 13) % 37;
  if (n === 0 || n === 1 || n % 5 === 2) place(placements, crop("spring-outdoors", n === 1 ? 16 : 0, n <= 1 ? 96 : 176, T, T), x*T, y*T, "ground", 1);
}
const mask = () => Array.from({ length: H }, () => Array<boolean>(W).fill(false));
const dirt = mask(), trackMask = mask();
ring(trackMask, 2, 28, 77, 46, 3);
ring(dirt, 2, 28, 77, 46, 3);
fillRect(dirt, 1, 14, 78, 15); fillRect(dirt, 39, 16, 40, 27); fillRect(dirt, 4, 3, 18, 12);
for (const x of [27,35,48,58,71]) fillRect(dirt, x, 10, x+1, 13);
const track: Placement[] = [];
for (const { x, y, c, r } of dirtTiles(dirt)) place(trackMask[y][x] ? track : placements, crop("flooring",64+c*T,64+r*T,T,T), x*T,y*T,trackMask[y][x] ? "buildings" : "paths",trackMask[y][x] ? 58 : 10);
function fenceH(list: Placement[], sheet: string, x0: number, x1: number, y: number, layer: Layer, z: number) {
  for (let x=x0;x<=x1;x++) place(list,crop(sheet,(x===x0?0:x===x1?2:1)*T,64,T,32),x*T,y*T-T,layer,z);
}
function pen(list: Placement[], sheet: string,x0: number,y0: number,x1: number,y1: number,gate=-1,layer: Layer="fences",z=30) {
  fenceH(list,sheet,x0,x1,y0,layer,z);
  if(gate<0) fenceH(list,sheet,x0,x1,y1,layer,z);
  else { fenceH(list,sheet,x0,gate-1,y1,layer,z); fenceH(list,sheet,gate+2,x1,y1,layer,z); }
  for(let y=y0+1;y<y1;y++) for(const x of [x0,x1]) place(list,crop(sheet,0,32,T,32),x*T,y*T-T,layer,z);
}
const tree = (list: Placement[],x: number,y: number,layer: Layer="decor",z=40) => place(list,crop(`tree${(x+y)%2+1}-spring`,0,0,48,96),x*T-T,(y+1)*T-96,layer,z);
const bushes = [crop("bushes",0,98,31,29),crop("bushes",32,98,31,29),crop("bushes",1,132,47,43)];
const bush = (list: Placement[],x: number,y: number,i: number,layer: Layer="decor",z=40) => place(list,bushes[i%3],x*T,(y+1)*T-bushes[i%3].h,layer,z);
pen(placements,"fence-wood",3,2,19,13,10);
pen(placements,"fence-wood",43,18,70,26,55);
pen(track,"fence-iron",5,31,74,43,-1,"buildings",58);
[[24,37],[44,40],[60,36]].forEach(([x,y])=>tree(track,x,y,"buildings",58));
[[15,36],[33,38],[52,35],[66,39]].forEach(([x,y],i)=>bush(track,x,y,i,"buildings",58));
track.sort((a,b)=>a.dest.y+a.src.h-b.dest.y-b.src.h);
building("track","Đường đua","TRACK",58,list=>list.push(...track));
building("stable","Khu chuồng","STALL",60,list=>{for(const x of [22,31]) place(list,crop("barn",0,0,96,128),x*T,T,"buildings",60);});
building("barn","Kho vật tư","SUPPLY",60,list=>{
  place(list,crop("silo",0,0,48,128),42*T,0,"buildings",60);
  place(list,crop("shed",0,0,112,128),45*T,T,"buildings",60);
  for(const [sx,sy,x] of [[96,448,44],[96,448,45],[32,448,51],[32,512,52]]) place(list,crop("craftables",sx,sy,16,32),x*T,9*T,"buildings",60);
});
building("vet","Phòng khám thú y","VET",60,list=>{
  place(list,crop("spring-town",16,176,64,128),70*T,T,"buildings",60);
  place(list,crop("spring-town",0,208,16,96),69*T,3*T,"buildings",60);
});
decor(crop("houses",0,288,160,144),54*T,T);
decor(crop("coop",0,0,96,112),22*T,17*T);
decor(crop("coop",0,112,64,16),22*T,24*T);
decor(crop("stable",0,0,64,96),73*T,18*T);
decor(crop("well",0,0,48,80),1216,32);
[[1,18],[3,23],[7,20],[12,25],[16,19],[79,25],[76,21],[20,9],[0,0]].forEach(([x,y])=>tree(placements,x,y));
[[10,17],[18,23],[74,26],[64,12],[30,24],[52,24]].forEach(([x,y],i)=>bush(placements,x,y,i));
placements.sort((a,b)=>a.dest.y+a.src.h-b.dest.y-b.src.h);
const anchors = { stableStalls: [{x:416,y:142},{x:560,y:142},{x:1200,y:372}], supplyDoor: {x:784,y:176}, houseDoor: {x:960,y:160}, clinicDoor: {x:1160,y:142} };
writeFileSync(new URL("./farm-layout.json",import.meta.url),JSON.stringify({version:4,world:{width:W*T,height:H*T,tile:T},fills,placements,objects,anchors},null,1));
console.log(`farm-layout.json: ${placements.length} placements, ${objects.length} objects, world ${W*T}×${H*T}`);
