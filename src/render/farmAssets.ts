import type { CritterSheet } from "../hub/ambientScene.ts";
import { FARM_OBJECTS } from "../hub/farmLayout.ts";

/** Con vật Stardew, PNG chép nguyên byte từ `Stardrew Valley/05_Animals_and_Ambient_Life/` (thay S16, không có bò). */
export const CRITTER_URLS: Record<CritterSheet, string> = {
  whiteChicken: "/assets/sprites/sv/white-chicken.png",
  brownChicken: "/assets/sprites/sv/brown-chicken.png",
  duck: "/assets/sprites/sv/duck.png",
  dog: "/assets/sprites/sv/dog.png",
  cat: "/assets/sprites/sv/cat.png",
};

export const FARM_ASSET_URLS = {
  ground: "/assets/maps/farm-ground.png",
  objects: Object.fromEntries(FARM_OBJECTS.map((object) => [object.id, `/assets/maps/objects/${object.id}.png`])),
  sheets: {
    horse: "/assets/sprites/s01-horse.png",
    stall: "/assets/sprites/s07-stall.png",
    people: "/assets/sprites/s06-people.png",
    fx: "/assets/sprites/s13-fx.png",
    rider: "/assets/sprites/s14-rider.png",
    vehicles: "/assets/sprites/s15-vehicles.png",
  },
  critters: CRITTER_URLS,
} as const;

export interface FarmAssets {
  ground: HTMLImageElement;
  objects: Map<string, HTMLImageElement>;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Không tải được tài nguyên map ${url}`));
    image.src = url;
  });
}

let farmAssetsPromise: Promise<FarmAssets> | null = null;

export function loadFarmAssets(): Promise<FarmAssets> {
  farmAssetsPromise ??= Promise.all([
    loadImage(FARM_ASSET_URLS.ground),
    ...Object.entries(FARM_ASSET_URLS.objects).map(async ([id, url]) => [id, await loadImage(url)] as const),
  ]).then(([ground, ...objects]) => ({ ground, objects: new Map(objects) }));
  return farmAssetsPromise;
}
