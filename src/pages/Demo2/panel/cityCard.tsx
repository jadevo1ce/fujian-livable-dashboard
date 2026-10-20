import { useRef } from "react";
import styled from "styled-components";
import {
  cityAtYear,
  citiesAtYear,
  cityColorMap,
  livableDimensions,
  provinceAvgAtYear,
  regionAtYear,
  type CityYear,
} from "../data";
import { useConfigStore } from "../stores";

// 卡片宽度与底部时间轴对齐（时间轴 ≈ 播放键+年份+480px 轨道+内边距 ≈ 660px）。
const CARD_WIDTH = 660;

const Wrap = styled.div<{ $open: boolean; $accent: string }>`
  position: absolute;
  bottom: 104px;
  left: 50%;
  transform: translateX(-50%)
    translateY(${(p) => (p.$open ? "0" : "16px")});
  box-sizing: border-box;
  width: ${CARD_WIDTH}px;
  opacity: ${(p) => (p.$open ? 1 : 0)};
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s;
  pointer-events: ${(p) => (p.$open ? "auto" : "none")};
  z-index: 29;
  padding: 16px 22px 18px;
  border-radius: 14px;
  color: #e6fbf1;
  background: linear-gradient(
    150deg,
    rgba(8, 32, 25, 0.95),
    rgba(6, 20, 30, 0.95)
  );
  border: 1px solid ${(p) => p.$accent}5c;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.5),
    0 0 26px ${(p) => p.$accent}2e, inset 0 0 32px rgba(47, 201, 142, 0.05);
  backdrop-filter: blur(10px);

  /* 顶部一条与城市同色的高光，呼应时间轴的胶囊风格 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 22px;
    right: 22px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${(p) => p.$accent},
      transparent
    );
    opacity: 0.7;
  }
`;

const Close = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(230, 251, 241, 0.5);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
`;

/* 顶部：城市名 + 排名 + 指数 同一行（不换行），标签另起一行 */
const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: nowrap;
  white-space: nowrap;
  padding-right: 28px;
`;

const CityName = styled.div`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const Rank = styled.span<{ $accent: string }>`
  font-size: 11px;
  color: rgba(230, 251, 241, 0.55);
  b {
    font-size: 16px;
    color: ${(p) => p.$accent};
    font-weight: 700;
    margin: 0 1px;
  }
`;

const IndexLine = styled.div<{ $accent: string }>`
  font-size: 12px;
  color: rgba(230, 251, 241, 0.7);
  display: flex;
  align-items: baseline;
  gap: 4px;

  b {
    font-size: 24px;
    line-height: 1;
    color: ${(p) => p.$accent};
    text-shadow: 0 0 12px ${(p) => p.$accent}99;
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
`;

const Tag = styled.span<{ $type: "up" | "down" }>`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 9px;
  color: ${(p) => (p.$type === "up" ? "#5fe3b8" : "#ffb35c")};
  background: ${(p) =>
    p.$type === "up" ? "rgba(95,227,184,0.12)" : "rgba(255,179,92,0.12)"};
  border: 1px solid
    ${(p) => (p.$type === "up" ? "rgba(95,227,184,0.4)" : "rgba(255,179,92,0.4)")};
`;

/* 主体两栏：左=维度对比条，右=关键统计 */
const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 210px;
  gap: 22px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(150, 230, 200, 0.16);
`;

const Bars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
`;

const DimRow = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr 72px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
`;

const DimName = styled.span`
  color: rgba(230, 251, 241, 0.8);
`;

const Track = styled.div`
  position: relative;
  height: 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
`;

const Fill = styled.div<{ $w: number; $accent: string }>`
  height: 100%;
  width: ${(p) => p.$w}%;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    ${(p) => p.$accent}aa,
    ${(p) => p.$accent}
  );
  box-shadow: 0 0 8px ${(p) => p.$accent}aa;
  transition: width 0.5s ease;
`;

const AvgTick = styled.span<{ $left: number }>`
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: ${(p) => p.$left}%;
  width: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.6);
`;

const DimVal = styled.span<{ $up: boolean }>`
  text-align: right;
  white-space: nowrap;

  b {
    color: #fff;
    font-weight: 600;
  }
  i {
    font-style: normal;
    margin-left: 4px;
    font-size: 11px;
    color: ${(p) => (p.$up ? "#5fe3b8" : "#ffb35c")};
  }
`;

const Side = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding-left: 20px;
  border-left: 1px solid rgba(150, 230, 200, 0.16);
`;

const Stat = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;

  span {
    font-size: 11px;
    color: rgba(230, 251, 241, 0.5);
  }
  b {
    font-size: 17px;
    color: #e6fbf1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const rankAt = (year: number, city: string) =>
  [...citiesAtYear(year)]
    .sort((a, b) => b.index - a.index)
    .findIndex((c) => c.city === city) + 1;

export default function CityCard() {
  const selectedCity = useConfigStore((s) => s.selectedCity);
  const setSelectedCity = useConfigStore((s) => s.setSelectedCity);
  const year = useConfigStore((s) => s.year);
  const lastName = useRef<string | null>(null);

  if (selectedCity) lastName.current = selectedCity;
  const name = selectedCity ?? lastName.current;
  // 九市用真实数据；区县（市级地图下）由 regionAtYear 回退到演示数据。
  const data: CityYear | null = name ? regionAtYear(name, year) : null;
  const isPrefecture = name ? !!cityAtYear(name, year) : false;
  const avg = provinceAvgAtYear(year);
  const accent = name ? cityColorMap[name] ?? "#2FC98E" : "#2FC98E";

  const strengths = data
    ? livableDimensions.filter((d) => data[d.key] >= avg[d.key])
    : [];
  const weaknesses = data
    ? livableDimensions.filter((d) => data[d.key] < avg[d.key])
    : [];

  return (
    <Wrap $open={!!selectedCity} $accent={accent}>
      {name && data && (
        <>
          <Close onClick={() => setSelectedCity(null)} aria-label="关闭">
            ×
          </Close>

          <Header>
            <CityName>{name}</CityName>
            {isPrefecture && (
              <Rank $accent={accent}>
                全省第 <b>{rankAt(year, name)}</b> / {citiesAtYear(year).length}
              </Rank>
            )}
            <IndexLine $accent={accent}>
              <b>{data.index}</b>
              <span>绿色宜居指数 · {year} 年</span>
            </IndexLine>
          </Header>

          <Tags>
            {strengths.slice(0, 2).map((d) => (
              <Tag key={d.key} $type="up">
                优势·{d.name}
              </Tag>
            ))}
            {weaknesses.slice(0, 2).map((d) => (
              <Tag key={d.key} $type="down">
                短板·{d.name}
              </Tag>
            ))}
          </Tags>

          <Body>
            <Bars>
              {livableDimensions.map((d) => {
                const value = data[d.key];
                const a = avg[d.key];
                const delta = Number((value - a).toFixed(1));
                return (
                  <DimRow key={d.key}>
                    <DimName>{d.name}</DimName>
                    <Track>
                      <Fill $w={Math.min(100, value)} $accent={accent} />
                      <AvgTick $left={Math.min(100, a)} />
                    </Track>
                    <DimVal $up={delta >= 0}>
                      <b>{value}</b>
                      <i>
                        {delta >= 0 ? "▲" : "▼"}
                        {Math.abs(delta)}
                      </i>
                    </DimVal>
                  </DimRow>
                );
              })}
            </Bars>

            <Side>
              <Stat>
                <span>城镇化率</span>
                <b>{data.urbanization}%</b>
              </Stat>
              <Stat>
                <span>常住人口</span>
                <b>{data.population} 万</b>
              </Stat>
              <Stat>
                <span>人均GDP</span>
                <b>{(data.gdpPerCapita / 10000).toFixed(2)} 万</b>
              </Stat>
            </Side>
          </Body>
        </>
      )}
    </Wrap>
  );
}
