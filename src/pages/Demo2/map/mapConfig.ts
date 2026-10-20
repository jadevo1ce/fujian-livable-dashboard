import type { CityGeoJSON } from "@/types/map";

/**
 * 可切换地图配置：公司运营中心七城（地级市粒度，下钻到区县）。
 * 地理边界文件内置于 public/geo/（同源加载，不依赖外部 CDN，
 * 避免预览 / 内网环境访问不了 geo.datav.aliyun.com 导致白屏）。
 * 原始来源：阿里云 DataV GeoJSON（{adcode}_full 含区县边界），
 * 缺失时可用 `npm run fetch-geo` 重新下载。
 */
export type MapId =
  | "quanzhou"
  | "xiamen"
  | "fuzhou"
  | "hangzhou"
  | "guangzhou"
  | "changsha"
  | "changchun";

export interface MapConfig {
  id: MapId;
  label: string;
  /** 本地内置数据（可选）；缺省时通过 dataUrl 远程加载。 */
  data?: CityGeoJSON;
  outlineData?: CityGeoJSON;
  dataUrl?: string;
  outlineUrl?: string;
  /** 是否使用岩石贴图（仅原福建省级地图需要，城市地图统一关闭）。 */
  textured: boolean;
}

const localBound = (adcode: number) => ({
  dataUrl: `${import.meta.env.BASE_URL}geo/${adcode}_full.json`,
  outlineUrl: `${import.meta.env.BASE_URL}geo/${adcode}.json`,
});

export const mapConfigs: Record<MapId, MapConfig> = {
  quanzhou: {
    id: "quanzhou",
    label: "泉州市",
    ...localBound(350500),
    textured: false,
  },
  xiamen: {
    id: "xiamen",
    label: "厦门市",
    ...localBound(350200),
    textured: false,
  },
  fuzhou: {
    id: "fuzhou",
    label: "福州市",
    ...localBound(350100),
    textured: false,
  },
  hangzhou: {
    id: "hangzhou",
    label: "杭州市",
    ...localBound(330100),
    textured: false,
  },
  guangzhou: {
    id: "guangzhou",
    label: "广州市",
    ...localBound(440100),
    textured: false,
  },
  changsha: {
    id: "changsha",
    label: "长沙市",
    ...localBound(430100),
    textured: false,
  },
  changchun: {
    id: "changchun",
    label: "长春市",
    ...localBound(220100),
    textured: false,
  },
};

/** 切换按钮展示顺序：按运营中心设立顺序排列。 */
export const mapConfigList: MapConfig[] = [
  mapConfigs.quanzhou,
  mapConfigs.xiamen,
  mapConfigs.fuzhou,
  mapConfigs.hangzhou,
  mapConfigs.guangzhou,
  mapConfigs.changsha,
  mapConfigs.changchun,
];
