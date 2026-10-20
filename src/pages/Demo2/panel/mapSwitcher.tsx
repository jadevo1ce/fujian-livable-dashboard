import styled from "styled-components";
import { useConfigStore } from "../stores";
import { mapConfigList } from "../map/mapConfig";

const Wrap = styled.div`
  position: absolute;
  top: 96px;
  right: 32px;
  display: flex;
  gap: 8px;
  z-index: 30;
`;

const MapButton = styled.button<{ $active: boolean }>`
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  color: ${(p) => (p.$active ? "#06251a" : "rgba(230, 251, 241, 0.78)")};
  background: ${(p) =>
    p.$active
      ? "linear-gradient(135deg, #5fe3b8, #2fc98e)"
      : "rgba(8, 32, 25, 0.72)"};
  border: 1px solid
    ${(p) => (p.$active ? "#5fe3b8" : "rgba(95, 227, 184, 0.32)")};
  box-shadow: ${(p) =>
    p.$active
      ? "0 0 16px rgba(95, 227, 184, 0.45)"
      : "inset 0 0 12px rgba(47, 201, 142, 0.06)"};
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;

  &:hover {
    color: ${(p) => (p.$active ? "#06251a" : "#e6fbf1")};
    border-color: #5fe3b8;
    box-shadow: 0 0 14px rgba(95, 227, 184, 0.35);
  }
`;

/** 地图切换：运营中心七城（泉州 / 厦门 / 福州 / 杭州 / 广州 / 长沙 / 长春，区县粒度）。 */
export default function MapSwitcher() {
  const mapId = useConfigStore((s) => s.mapId);
  const setMapId = useConfigStore((s) => s.setMapId);
  const mapPlayComplete = useConfigStore((s) => s.mapPlayComplete);

  if (!mapPlayComplete) return null;

  return (
    <Wrap>
      {mapConfigList.map((cfg) => (
        <MapButton
          key={cfg.id}
          $active={cfg.id === mapId}
          onClick={() => setMapId(cfg.id)}>
          {cfg.label}
        </MapButton>
      ))}
    </Wrap>
  );
}
