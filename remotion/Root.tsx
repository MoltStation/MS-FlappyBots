import { Composition } from 'remotion';
import { FlappyBotsLaunch } from './launch/FlappyBotsLaunch';
import { FlappyBotsTwitterLaunch } from './launch/FlappyBotsTwitterLaunch';
import { MoltStationXLaunch } from './launch/MoltStationXLaunch';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id='FlappyBotsLaunch'
        component={FlappyBotsLaunch}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id='FlappyBotsTwitterLaunch'
        component={FlappyBotsTwitterLaunch}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id='MoltStationXLaunch'
        component={MoltStationXLaunch}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
