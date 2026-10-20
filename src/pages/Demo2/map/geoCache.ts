import type { CityGeoJSON } from "@/types/map";

/**
 * GeoJSON 远程加载缓存（Suspense 模式）：
 * read() 在数据就绪前 throw Promise 挂起渲染，失败后 throw Error，
 * 成功后缓存结果，重复切换地图不会重复请求。
 */
interface Entry {
  status: "pending" | "done" | "error";
  promise: Promise<void>;
  data?: CityGeoJSON;
  error?: unknown;
}

const cache = new Map<string, Entry>();

export function fetchGeoJson(url: string): CityGeoJSON {
  let entry = cache.get(url);
  if (!entry) {
    const e: Entry = {
      status: "pending",
      promise: fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`GeoJSON 加载失败: ${res.status}`);
          return res.json();
        })
        .then((json) => {
          e.status = "done";
          e.data = json as CityGeoJSON;
        })
        .catch((err) => {
          e.status = "error";
          e.error = err;
        }),
    };
    entry = e;
    cache.set(url, entry);
  }
  if (entry.status === "pending") throw entry.promise;
  if (entry.status === "error") throw entry.error;
  return entry.data!;
}

/** 清空缓存（加载失败后点击「重试」时调用，让下一次渲染重新发起请求）。 */
export function clearGeoCache() {
  cache.clear();
}
