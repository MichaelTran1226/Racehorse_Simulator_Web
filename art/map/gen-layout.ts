// Sinh bố cục v3 (theo ảnh tham khảo, chỉ lấy bố cục) bằng crop/copy nguyên kích thước từ sheet Stardew.
// Đường xe hàng 3 ô chạy thẳng mép trái → cửa kho → mép phải; đường đua bầu dục nhỏ hơn; không có nước.
import { writeFileSync } from "node:fs";
import { dirtTiles, fillRect, stadiumRing } from "./autotile.ts";
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
/** Đặt sprite sao cho cạnh dưới nằm ở đáy ô hàng `row`. */
const stand = (list: Placement[], s: Src, col: number, row: number, layer: Layer, z: number) => place(list, s, col * T, (row + 1) * T - s.h, layer, z);
function building(id: string, name: string, target: string, z: number, draw: (list: Placement[]) => void) {
  const list: Placement[] = [];
  draw(list);
  const x = Math.min(...list.map((p) => p.dest.x)), y = Math.min(...list.map((p) => p.dest.y));
  const bounds = { x, y, w: Math.max(...list.map((p) => p.dest.x + p.src.w)) - x, h: Math.max(...list.map((p) => p.dest.y + p.src.h)) - y };
  objects.push({ id, name, target, z, focus: { x: x + bounds.w / 2, y: y + bounds.h / 2 }, bounds, placements: list });
}
const decor = (s: Src, col: number, row: number) => stand(placements, s, col, row, "decor", 40);

// Ground: grass + deterministic tufts (như v2).
const grass = crop("spring-outdoors", 0, 112, T, T);
fills.push({ id: "grass", sheet: grass.sheet, src: { x: grass.x, y: grass.y, w: T, h: T }, area: { x: 0, y: 0, w: W*T, h: H*T }, step: { x: T, y: T }, layer: "ground", z: 0 });
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const n = (x * 7 + y * 13) % 37;
  if (n === 0 || n === 1 || n % 5 === 2) place(placements, crop("spring-outdoors", n === 1 ? 16 : 0, n <= 1 ? 96 : 176, T, T), x*T, y*T, "ground", 1);
}

// Dirt: roads, training sand, race track (autotile chung để chỗ nối liền mạch).
const mask = () => Array.from({ length: H }, () => Array<boolean>(W).fill(false));
const dirt = mask(), trackMask = mask();
const TRUCK_ROWS = [19, 21] as const;
fillRect(dirt, 0, TRUCK_ROWS[0], W - 1, TRUCK_ROWS[1]); // đường xe hàng, 3 ô, xuyên ngang
fillRect(dirt, 1, 5, 78, 6);                            // đường trên
fillRect(dirt, 12, 5, 13, 47);                          // đường dọc phía tây
fillRect(dirt, 38, 5, 39, 18);                          // nhánh giữa chuồng ngựa và trạm y tế
for (const x of [18, 30, 45, 57, 68]) fillRect(dirt, x, 18, x + 1, 18); // lối ra đường: kho, chuồng, y tế, nhà NV, sân tập
fillRect(dirt, 5, 7, 6, 8); fillRect(dirt, 5, 22, 6, 23); // cổng vườn trên / dưới
fillRect(dirt, 62, 9, 77, 16);                          // sân cát huấn luyện
stadiumRing(trackMask, 16, 25, 62, 44, 3);
stadiumRing(dirt, 16, 25, 62, 44, 3);
fillRect(dirt, 12, 34, 16, 35);                         // đường tây → đường đua
fillRect(dirt, 64, 22, 65, 35); fillRect(dirt, 62, 34, 65, 35); // nhánh đông → đường đua
fillRect(dirt, 39, 44, 41, 47);                         // cổng nam đường đua
const track: Placement[] = [];
for (const { x, y, c, r } of dirtTiles(dirt)) place(trackMask[y][x] ? track : placements, crop("flooring",64+c*T,64+r*T,T,T), x*T,y*T,trackMask[y][x] ? "buildings" : "paths",trackMask[y][x] ? 58 : 10);

function fenceH(list: Placement[], sheet: string, x0: number, x1: number, y: number, layer: Layer = "fences", z = 30) {
  for (let x=x0;x<=x1;x++) place(list,crop(sheet,(x===x0?0:x===x1?2:1)*T,64,T,32),x*T,y*T-T,layer,z);
}
function fenceV(list: Placement[], sheet: string, x: number, y0: number, y1: number, layer: Layer = "fences", z = 30) {
  for (let y=y0;y<=y1;y++) place(list,crop(sheet,0,32,T,32),x*T,y*T-T,layer,z);
}
const TREES = [crop("tree1-spring",0,0,48,96), crop("tree2-spring",0,0,48,96), crop("spring-outdoors",160,0,48,96)]; // sồi, phong, thông
const tree = (list: Placement[],x: number,y: number,k: number,layer: Layer="decor",z=40) => place(list,TREES[k%3],x*T-T,(y+1)*T-96,layer,z);
/** Chỗ chim đậu (chân chim, pixel thế giới): đỉnh tán sồi/phong, cành bên của thông. */
const perches: { x: number; y: number }[] = [];
const perch = (x: number, y: number, k: number) => perches.push(k % 3 === 2 ? { x: x*T-T+14, y: (y+1)*T-96+38 } : { x: x*T-T+24, y: (y+1)*T-96+14 });
const perchedTree = (list: Placement[], x: number, y: number, k: number, layer: Layer = "decor", z = 40) => { tree(list, x, y, k, layer, z); perch(x, y, k); };
const BUSHES = [crop("bushes",0,98,31,29),crop("bushes",32,98,31,29),crop("bushes",1,132,47,43)];
const bush = (list: Placement[],x: number,y: number,k: number,layer: Layer="decor",z=40) => place(list,BUSHES[k%3],x*T,(y+1)*T-BUSHES[k%3].h,layer,z);
const LAMP = crop("spring-town",176,448,16,48), HAY = crop("flooring",16,224,16,16), SIGN = crop("spring-outdoors",160,256,16,32);
const BENCH = crop("spring-town",32,144,32,32), SCARECROW = crop("craftables",0,32,16,32);
const BARREL = [crop("craftables",96,448,16,32), crop("craftables",32,448,16,32)];

// Bốn công trình chính (đáy ở hàng 17), giãn đều; chuồng ngựa cách kho 6 ô.
building("barn","Kho vật tư","SUPPLY",60,list=>{
  stand(list,crop("shed",0,0,112,128),15,17,"buildings",60);
  stand(list,BARREL[0],22,17,"buildings",60); stand(list,BARREL[1],23,17,"buildings",60); stand(list,BARREL[1],22,15,"buildings",60);
});
building("stable","Khu chuồng","STALL",60,list=>{
  stand(list,crop("barn",0,0,96,128),28,17,"buildings",60);
  stand(list,crop("stable",0,0,64,96),34,17,"buildings",60);
});
building("vet","Phòng khám thú y","VET",60,list=>stand(list,crop("clinic",0,0,112,128),42,17,"buildings",60));
building("groom-house", "Nhân viên", "GROOM", 60, (list) =>
  stand(list, crop("houses", 16, 288, 144, 144), 52, 17, "buildings", 60),
);

// Đường đua: hàng rào gỗ ngoài, rào sắt trong, vườn giữa (cây đặt chừa dải giữa cho ngựa thả).
fenceH(track,"fence-wood",26,53,24,"buildings",58);
fenceH(track,"fence-wood",26,37,45,"buildings",58); fenceH(track,"fence-wood",43,53,45,"buildings",58);
fenceH(track,"fence-iron",26,53,28,"buildings",58); fenceH(track,"fence-iron",26,53,41,"buildings",58);
// Cây rải lệch hàng: cụm trái, cụm phải, hai cây giữa ở dưới dải ngựa thả (y 464–528, x 444–776).
[[24,34,1],[21,38,2],[52,33,2],[57,36,0],[50,40,1],[34,40,2],[43,39,0]].forEach(([x,y,k],i)=>(i%2===0?perchedTree:tree)(track,x,y,k,"buildings",58));
stand(track,BENCH,40,38,"buildings",58);
stand(track,LAMP,38,45,"buildings",58); stand(track,LAMP,42,45,"buildings",58); // đèn cổng nam
[[37,40],[38,40],[37,39]].forEach(([x,y])=>stand(track,HAY,x,y,"buildings",58));
[[29,39],[47,37],[54,40]].forEach(([x,y],i)=>bush(track,x,y,i,"buildings",58));
track.sort((a,b)=>a.dest.y+a.src.h-b.dest.y-b.src.h);
building("track","Đường đua","TRACK",58,list=>list.push(...track));

// Viền trên: hai hàng cây sau hàng rào dọc đường trên.
for (let x = 1; x < W; x += 4) tree(placements,x,2,x);
for (let x = 3; x < W; x += 4) tree(placements,x,0,x+1);
fenceH(placements,"fence-wood",14,37,4); fenceH(placements,"fence-wood",40,78,4);

// Vườn cảnh trên (cối xay).
fenceH(placements,"fence-wood",1,4,8); fenceH(placements,"fence-wood",7,10,8); fenceH(placements,"fence-wood",1,10,17);
fenceV(placements,"fence-wood",1,9,16); fenceV(placements,"fence-wood",10,9,16);
decor(crop("mill",0,0,64,128),2,16);
decor(SIGN,7,10); // gà vịt sống ở góc dưới phải vườn này (cột 6–9, hàng 12–16): cỏ khô dồn lên góc trên phải
[[9,10],[9,11],[8,11]].forEach(([x,y])=>decor(HAY,x,y));

// Vườn cảnh dưới (giếng, ghế, luống hoa, lối đá).
fenceH(placements,"fence-wood",1,4,23); fenceH(placements,"fence-wood",7,10,23); fenceH(placements,"fence-wood",1,10,46);
fenceV(placements,"fence-wood",1,24,45); fenceV(placements,"fence-wood",10,24,45);
decor(crop("well",0,0,48,80),2,30); decor(BENCH,2,36); decor(SCARECROW,8,43);
[[3,39],[4,39]].forEach(([x,y])=>decor(HAY,x,y));
for (let y = 24; y <= 45; y++) place(placements,crop("flooring",64+(y%4)*T,128,T,T),6*T,y*T,"paths",11);
for (let y = 25; y <= 44; y += 2) place(placements,crop("spring-outdoors",112,y%4===1?160:192,T,T),8*T,y*T,"decor",40);
bush(placements,2,41,2); bush(placements,3,45,0); bush(placements,7,32,1);

// Sân huấn luyện (đông bắc): rào gỗ, thanh nhảy rào sắt, cỏ khô, thùng; cổng mở ra đường xe hàng.
fenceH(placements,"fence-wood",61,78,8);
fenceH(placements,"fence-wood",61,67,17); fenceH(placements,"fence-wood",70,78,17);
fenceV(placements,"fence-wood",61,9,16); fenceV(placements,"fence-wood",78,9,16);
fenceH(placements,"fence-iron",64,67,12); fenceH(placements,"fence-iron",71,74,15);
decor(BARREL[0],75,10); decor(BARREL[1],76,10); decor(SIGN,63,10);
[[70,10],[71,10],[76,14]].forEach(([x,y])=>decor(HAY,x,y));

// Đèn, cây quanh dãy nhà và đường.
[[14,18],[26,18],[41,18],[51,18],[61,18],[15,24],[63,24]].forEach(([x,y])=>decor(LAMP,x,y));
perchedTree(placements,25,12,1); perchedTree(placements,50,15,0);
// Rừng phía đông và nam (chừa sân gà phía đông).
[[70,27],[75,30],[72,36],[78,33],[77,40],[68,45]].forEach(([x,y],i)=>(i<3?perchedTree:tree)(placements,x,y,i));
[[74,46],[17,47],[30,47],[48,47],[58,47]].forEach(([x,y],i)=>bush(placements,x,y,i%2)); // bụi thấp: không chạm khung đường đua

// Hoa và đá rải trên cỏ.
const FLOWERS = [[112,160],[112,192],[112,160],[112,176]];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const onBuilding = objects.some(({ bounds: b }) => x*T < b.x + b.w && x*T + T > b.x && y*T < b.y + b.h && y*T + T > b.y);
  if ((x * 31 + y * 17) % 23 === 0 && !dirt[y][x] && !onBuilding) {
    const [sx, sy] = FLOWERS[(x + y) % 4];
    place(placements,crop("spring-outdoors",sx,sy,T,T),x*T,y*T,"decor",40);
  }
}
placements.sort((a,b)=>a.dest.y+a.src.h-b.dest.y-b.src.h);

// Toạ độ gắn công trình (pixel thế giới): 2 chỗ trong cửa Barn + mái che Stable; cửa kho/nhà NV/phòng khám nằm trên lối ra đường.
const anchors = {
  stableStalls: [{ x: 496, y: 286 }, { x: 528, y: 286 }, { x: 576, y: 276 }],
  supplyDoor: { x: 304, y: 284 },
  houseDoor: { x: 920, y: 286 },
  clinicDoor: { x: 728, y: 284 },
  /** Tâm cụm 4 công trình chính: màn chính mở ra ở đây. */
  mainFocus: { x: 584, y: 236 },
  perches,
};
writeFileSync(new URL("./farm-layout.json",import.meta.url),JSON.stringify({version:5,world:{width:W*T,height:H*T,tile:T},fills,placements,objects,anchors},null,1));
console.log(`farm-layout.json: ${placements.length} placements, ${objects.length} objects, world ${W*T}×${H*T}`);
