// 짬짬이 교실 1분 소개 영상(1920×1080, 30fps). 장면 사이는 짧게 겹쳐 넘어간다.
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { useEffect, useState } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, continueRender, delayRender, interpolate, staticFile } from "remotion";
import { Eight } from "./scenes/Eight";
import { Free } from "./scenes/Free";
import { Hook } from "./scenes/Hook";
import { Outro } from "./scenes/Outro";
import { Sites, SITE_LEN } from "./scenes/Sites";
import { Switcher } from "./scenes/Switcher";
import { Title } from "./scenes/Title";
import { C, fontsReady } from "./theme";

const T = 12; // 장면 전환 길이(프레임)
const BGM_VOLUME = 1; // 효과음이 묻히지 않을 만큼

export const SCENES = [
  { name: "Hook", len: 105, el: <Hook /> },
  { name: "Title", len: 140, el: <Title /> },
  { name: "Eight", len: 185, el: <Eight /> },
  { name: "Sites", len: SITE_LEN * 8, el: <Sites /> },
  { name: "Switcher", len: 165, el: <Switcher /> },
  { name: "Free", len: 160, el: <Free /> },
  { name: "Outro", len: 170, el: <Outro /> },
];

export const INTRO_LEN = SCENES.reduce((a, s) => a + s.len, 0) - T * (SCENES.length - 1);

export const IntroVideo: React.FC = () => {
  const [handle] = useState(() => delayRender("글꼴 읽기"));
  useEffect(() => {
    fontsReady.then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: C.bg, wordBreak: "keep-all" }}>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const seq = (
            <TransitionSeries.Sequence key={s.name} name={s.name} durationInFrames={s.len}>
              {s.el}
            </TransitionSeries.Sequence>
          );
          if (i === SCENES.length - 1) return [seq];
          // 먹색 화면이 드나드는 곳(처음·마지막)은 겹쳐 사라지고, 나머지는 옆으로 민다
          const presentation = i === 0 || i === SCENES.length - 2 ? fade() : slide({ direction: "from-right" });
          return [seq, <TransitionSeries.Transition key={`${s.name}-t`} presentation={presentation} timing={linearTiming({ durationInFrames: T })} />];
        })}
      </TransitionSeries>
      {/* 배경음악(scripts/make-bgm.mjs 로 만든 곡): 처음 0.5초 들어오고 마지막 1.5초 사라진다 */}
      <Audio
        src={staticFile("bgm.wav")}
        volume={(f) =>
          interpolate(f, [0, 15, INTRO_LEN - 45, INTRO_LEN], [0, BGM_VOLUME, BGM_VOLUME, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
