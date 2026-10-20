import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { latestYear } from "../data";
import type { MapId } from "../map/mapConfig";

interface ConfigStore {
  mapPlayComplete: boolean;
  /** 当前展示的地图（运营中心七城之一） */
  mapId: MapId;
  /** 鼠标悬停的城市（临时高亮，离开即清空） */
  hoveredCity: string | null;
  /** 点击锁定的城市（持续高亮 + 打开详情卡片 + 相机聚焦） */
  selectedCity: string | null;
  /** 时间轴当前年份（驱动地图与各图表随时间变化） */
  year: number;
  /** 切换地图，同时清空悬停 / 选中状态 */
  setMapId: (mapId: MapId) => void;
  setHoveredCity: (city: string | null) => void;
  /** 再次点击同一城市则取消选择；传入 null 直接关闭 */
  setSelectedCity: (city: string | null) => void;
  setYear: (year: number) => void;
  toggle: (key: "mapPlayComplete") => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigStore>()(
  subscribeWithSelector((set, _, store) => ({
    mapPlayComplete: false,
    mapId: "quanzhou",
    hoveredCity: null,
    selectedCity: null,
    year: latestYear,
    setMapId: (mapId) =>
      set({ mapId, hoveredCity: null, selectedCity: null }),
    setHoveredCity: (city) => set({ hoveredCity: city }),
    setSelectedCity: (city) =>
      set((s) => ({ selectedCity: s.selectedCity === city ? null : city })),
    setYear: (year) => set({ year }),
    toggle: (key) => set((s) => ({ [key]: !s[key] })),
    reset: () => set(store.getInitialState()),
  }))
);

/** 当前生效的高亮城市：优先取悬停，其次取选中。 */
export const activeCitySelector = (s: ConfigStore) =>
  s.hoveredCity ?? s.selectedCity;
