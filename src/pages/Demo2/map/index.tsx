import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import styled from "styled-components";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Lights from "./lights";
import Mirror from "./mirror";
import Base from "./base";
import Bottom from "./bottom";
import BeamLight from "./beamLight";
import { mapConfigs, type MapConfig } from "./mapConfig";
import { clearGeoCache, fetchGeoJson } from "./geoCache";
import { useConfigStore } from "../stores";
import type { CityGeoJSON } from "@/types/map";
import type { Vector3 } from "three";

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const ErrorTip = styled.div`
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  z-index: 40;
  padding: 18px 26px;
  border-radius: 12px;
  border: 1px solid rgba(95, 227, 184, 0.45);
  background: rgba(8, 32, 25, 0.88);
  color: #e6fbf1;
  font-size: 14px;
  letter-spacing: 1px;
  text-align: center;
  backdrop-filter: blur(8px);

  button {
    margin-left: 14px;
    padding: 6px 18px;
    border-radius: 999px;
    border: 1px solid #5fe3b8;
    background: linear-gradient(135deg, #5fe3b8, #2fc98e);
    color: #06251a;
    font-size: 13px;
    cursor: pointer;
  }
`;

/**
 * 地图数据加载失败兜底：捕获 Canvas 内抛出的加载错误，
 * 退化为显示错误提示 + 重试按钮，避免整屏白屏。
 */
class MapErrorBoundary extends Component<
  { onError: (err: unknown) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    this.props.onError(err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** GeoJSON 地图：数据就绪前挂起（外层 Suspense 兜底），就绪后渲染 Base。 */
function RemoteBase({
  config,
  controls,
}: {
  config: MapConfig;
  controls: React.RefObject<{ target: Vector3; update: () => void } | null>;
}) {
  const data = config.data ?? fetchGeoJson(config.dataUrl!);
  const outlineData =
    config.outlineData ??
    (config.outlineUrl ? fetchGeoJson(config.outlineUrl) : undefined);
  return (
    <Base
      data={data as CityGeoJSON}
      outlineData={outlineData as CityGeoJSON}
      textured={config.textured}
      controls={controls}
    />
  );
}

export default function Map() {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const mapId = useConfigStore((s) => s.mapId);
  const config = mapConfigs[mapId];
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // 切换地图后清除上一次的错误提示，并重挂载错误边界。
  useEffect(() => {
    setLoadError(null);
  }, [mapId]);

  const retry = () => {
    clearGeoCache();
    setLoadError(null);
    setRetryTick((t) => t + 1);
  };

  return (
    <CanvasWrapper>
      <Canvas
        camera={{
          fov: 70,
          position: [8.5, 10, 6.5],
        }}
        dpr={[1, 2]}>
        <fog attach="fog" args={["#000000", 10, 30]} />
        <color attach="background" args={["#000000"]} />
        <Lights />
        <Suspense fallback={null}>
          {/* key 随地图切换 / 重试变化：强制重挂载，让投影、入场动画、相机聚焦全部按新地图重算 */}
          <MapErrorBoundary
            key={`${config.id}:${retryTick}`}
            onError={(err) =>
              setLoadError(err instanceof Error ? err.message : String(err))
            }>
            <RemoteBase config={config} controls={controlsRef} />
          </MapErrorBoundary>
        </Suspense>
        <Bottom />
        <Mirror />
        <BeamLight />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          zoomSpeed={0.3}
          minDistance={2.4}
          maxDistance={24}
          maxPolarAngle={1.5}
        />
      </Canvas>
      {loadError && (
        <ErrorTip>
          地图数据加载失败（{loadError}），请检查网络后重试
          <button onClick={retry}>重试</button>
        </ErrorTip>
      )}
    </CanvasWrapper>
  );
}
