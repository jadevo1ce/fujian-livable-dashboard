/**
 * 下载运营中心七城的 GeoJSON 边界文件到 public/geo/。
 * 来源：阿里云 DataV GeoJSON（{adcode}_full 含区县边界）。
 * 已存在的文件会跳过，删除后重跑即可重新下载。
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ADCODES = [350500, 350200, 350100, 330100, 440100, 430100, 220100];
const BASE = "https://geo.datav.aliyun.com/areas_v3/bound";
const outDir = join(dirname(fileURLToPath(import.meta.url)), "../public/geo");

mkdirSync(outDir, { recursive: true });

for (const code of ADCODES) {
  for (const suffix of ["_full", ""]) {
    const file = join(outDir, `${code}${suffix}.json`);
    if (existsSync(file)) {
      console.log(`skip  ${code}${suffix}.json`);
      continue;
    }
    const res = await fetch(`${BASE}/${code}${suffix}.json`);
    if (!res.ok) throw new Error(`下载失败 ${code}${suffix}: ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`done  ${code}${suffix}.json`);
  }
}
