import { Composition } from "remotion";
import { INTRO_LEN, IntroVideo } from "./IntroVideo";

export const RemotionRoot: React.FC = () => (
  <Composition id="IntroVideo" component={IntroVideo} durationInFrames={INTRO_LEN} fps={30} width={1920} height={1080} />
);
