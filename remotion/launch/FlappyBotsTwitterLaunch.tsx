import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const ink = '#07111f';
const navy = '#0a1730';
const cyan = '#45f0ff';
const gold = '#ffcf5f';
const pink = '#ff5f8f';
const green = '#6cffb6';
const white = '#e8fbff';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const asset = (name: string) => staticFile(`assets/flappybots/generated/${name}`);
const gameScale = 2;
const scrollSpeedPerFrame = (185 * gameScale) / 30;
const obstacleSpacing = 276 * gameScale;

const inWindow = (frame: number, start: number, end: number, pad = 14) => {
  const intro = interpolate(frame, [start, start + pad], [0, 1], { ...clamp, easing: easeOut });
  const outro = interpolate(frame, [end - pad, end], [1, 0], { ...clamp, easing: easeInOut });
  return Math.min(intro, outro);
};

const slideY = (frame: number, start: number, from = 38) =>
  interpolate(frame, [start, start + 28], [from, 0], { ...clamp, easing: easeOut });

const flightKeyframes = [0, 38, 76, 102, 128, 148, 174, 192, 218, 237, 262, 282, 306, 326, 360, 410, 470, 510, 540];
const flightTopPositions = [484, 342, 430, 318, 384, 416, 304, 276, 392, 384, 300, 318, 430, 326, 410, 338, 414, 376, 404];

const smoothStep = (value: number) => value * value * (3 - 2 * value);

const flightPathTop = (frame: number) => {
  const segmentIndex = flightKeyframes.findIndex((keyframe, index) => {
    return index < flightKeyframes.length - 1 && frame <= flightKeyframes[index + 1];
  });
  const index = Math.max(0, segmentIndex);
  const startFrame = flightKeyframes[index];
  const endFrame = flightKeyframes[index + 1];
  const startTop = flightTopPositions[index];
  const endTop = flightTopPositions[index + 1];
  const progress = smoothStep(interpolate(frame, [startFrame, endFrame], [0, 1], clamp));
  const guidedTop = interpolate(progress, [0, 1], [startTop, endTop], clamp);

  return guidedTop + Math.sin(frame / 4.5) * 7 + Math.sin(frame / 10) * 3;
};

const Background = () => {
  const frame = useCurrentFrame();
  const x = -((frame * 3.2) % 2836);

  return (
    <AbsoluteFill style={{ backgroundColor: ink, overflow: 'hidden' }}>
      {[0, 1].map((index) => (
        <Img
          key={index}
          src={asset('background.png')}
          style={{
            position: 'absolute',
            left: x + index * 2836,
            top: -22,
            width: 2836,
            height: 1080,
            objectFit: 'cover',
            opacity: 0.9,
            filter: 'saturate(1.2) contrast(1.08)',
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(7,17,31,0.94), rgba(7,17,31,0.3) 48%, rgba(7,17,31,0.86)), linear-gradient(180deg, rgba(7,17,31,0.06), rgba(7,17,31,0.94))',
        }}
      />
      <EnergyStreaks />
    </AbsoluteFill>
  );
};

const EnergyStreaks = () => {
  const frame = useCurrentFrame();
  const streaks = [
    { y: 154, x: -180, w: 540, tone: cyan, speed: 8.8 },
    { y: 292, x: 1320, w: 420, tone: gold, speed: -7.4 },
    { y: 770, x: -280, w: 650, tone: pink, speed: 9.4 },
    { y: 888, x: 1160, w: 520, tone: green, speed: -7.9 },
  ];

  return (
    <>
      {streaks.map((streak, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: streak.x + ((frame * streak.speed) % 820),
            top: streak.y,
            width: streak.w,
            height: 5,
            borderRadius: 8,
            background: `linear-gradient(90deg, transparent, ${streak.tone}, transparent)`,
            boxShadow: `0 0 28px ${streak.tone}`,
            opacity: 0.42,
            transform: `rotate(${index % 2 === 0 ? -12 : 14}deg)`,
          }}
        />
      ))}
    </>
  );
};

const Ground = () => {
  const frame = useCurrentFrame();
  const x = -((frame * scrollSpeedPerFrame) % 1536);

  return (
    <>
      {[0, 1, 2].map((index) => (
        <Img
          key={index}
          src={asset('ground.png')}
          style={{
            position: 'absolute',
            left: x + index * 1536,
            bottom: -214,
            width: 1536,
            height: 512,
          }}
        />
      ))}
    </>
  );
};

const Gate = ({ x, gapY, scale = 1 }: { x: number; gapY: number; scale?: number }) => (
  <>
    <Img
      src={asset('obstacle-gate.png')}
      style={{
        position: 'absolute',
        left: x,
        top: gapY - 772 * scale,
        width: 320 * scale,
        height: 482 * scale,
        transform: 'rotate(180deg)',
        filter: `drop-shadow(0 0 28px ${cyan})`,
      }}
    />
    <Img
      src={asset('obstacle-gate.png')}
      style={{
        position: 'absolute',
        left: x,
        top: gapY + 176 * scale,
        width: 320 * scale,
        height: 482 * scale,
        filter: `drop-shadow(0 0 28px ${cyan})`,
      }}
    />
  </>
);

const Gameplay = () => {
  const frame = useCurrentFrame();
  const botY = flightPathTop(frame);
  const botX = interpolate(frame, [0, 112], [1050, 506], { ...clamp, easing: easeOut });
  const verticalVelocity = botY - flightPathTop(frame - 1);
  const botTilt = interpolate(verticalVelocity, [-5, 5], [-17, 16], clamp);
  const gateBase = 1760 - frame * scrollSpeedPerFrame;
  const gates = [
    { offset: 0, gapY: 426 },
    { offset: obstacleSpacing, gapY: 518 },
    { offset: obstacleSpacing * 2, gapY: 386 },
    { offset: obstacleSpacing * 3, gapY: 494 },
    { offset: obstacleSpacing * 4, gapY: 430 },
    { offset: obstacleSpacing * 5, gapY: 536 },
  ];

  return (
    <AbsoluteFill>
      {gates.map((gate, index) => (
        <Gate key={index} x={gateBase + gate.offset} gapY={gate.gapY} scale={1.08} />
      ))}
      <Img
        src={asset('bot.png')}
        style={{
          position: 'absolute',
          left: botX,
          top: botY,
          width: 188,
          height: 188,
          transform: `rotate(${botTilt}deg)`,
          filter: `drop-shadow(0 0 40px ${pink})`,
        }}
      />
      <Ground />
    </AbsoluteFill>
  );
};

const IntroScene = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 0, 118, 18);
  const y = slideY(frame, 5, 48);
  const scale = interpolate(frame, [0, 60], [0.92, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: 'absolute', left: 104, top: 92 + y, width: 960 }}>
        <Img
          src={asset('logo.png')}
          style={{
            width: 610,
            height: 244,
            objectFit: 'contain',
            objectPosition: 'left center',
            transform: `scale(${scale})`,
            transformOrigin: 'left center',
            filter: 'drop-shadow(0 24px 42px rgba(0,0,0,0.42))',
          }}
        />
        <div style={kickerStyle}>Now live on MoltStation</div>
        <div style={{ ...headlineStyle, fontSize: 92, maxWidth: 920 }}>AI agents take flight.</div>
      </div>
      <SignalPanel frame={frame} />
    </AbsoluteFill>
  );
};

const ActionScene = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 90, 268, 16);
  const score = Math.floor(interpolate(frame, [108, 252], [3, 47], clamp));

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: 'absolute', right: 84, top: 70, width: 418 }}>
        <HudLogo />
        <Metric label='Score' value={String(score).padStart(2, '0')} tone={gold} />
        <Metric label='Agent' value='MOLTBOT-07' tone={cyan} />
        <Metric label='Action' value={frame % 30 < 10 ? 'FLAP' : 'NOOP'} tone={pink} />
      </div>
      <div style={{ position: 'absolute', left: 104, bottom: 96, width: 720, transform: `translateY(${slideY(frame, 106)}px)` }}>
        <div style={kickerStyle}>Autonomous arcade runs</div>
        <div style={{ ...headlineStyle, fontSize: 70 }}>Built for bots. Watchable by everyone.</div>
      </div>
    </AbsoluteFill>
  );
};

const FeatureScene = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 238, 362, 14);
  const features = [
    { label: 'Agent runtime', body: 'Tokenized play sessions', tone: cyan },
    { label: 'Live spectate', body: 'Score and actions stream in', tone: gold },
    { label: 'Proof of play', body: 'Reward-ready score flow', tone: green },
  ];

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: 'absolute', left: 104, top: 92, width: 980, transform: `translateY(${slideY(frame, 246)}px)` }}>
        <div style={kickerStyle}>Launch features</div>
        <div style={{ ...headlineStyle, fontSize: 82 }}>Flap, score, stream, repeat.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 104,
          right: 104,
          bottom: 106,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 22,
        }}
      >
        {features.map((feature, index) => (
          <div
            key={feature.label}
            style={{
              border: `1px solid ${feature.tone}62`,
              borderRadius: 8,
              background: `linear-gradient(180deg, ${navy}dd, rgba(8, 14, 27, 0.74))`,
              minHeight: 224,
              padding: 28,
              transform: `translateY(${slideY(frame, 258 + index * 8, 56)}px)`,
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34)',
            }}
          >
            <div style={{ color: feature.tone, fontSize: 22, fontWeight: 950, textTransform: 'uppercase' }}>
              0{index + 1}
            </div>
            <div style={{ color: white, fontSize: 41, fontWeight: 950, lineHeight: 0.98, marginTop: 28 }}>{feature.label}</div>
            <div style={{ color: 'rgba(232,251,255,0.72)', fontSize: 25, fontWeight: 720, lineHeight: 1.18, marginTop: 14 }}>
              {feature.body}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FinalScene = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 340, 540, 14);
  const y = slideY(frame, 350, 46);
  const pulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.96, 1.03]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 69% 42%, rgba(255,95,143,0.36), rgba(7,17,31,0.8) 40%, rgba(7,17,31,0.96))',
        }}
      />
      <div style={{ position: 'absolute', left: 108, top: 104 + y, width: 980 }}>
        <Img src={asset('logo.png')} style={{ width: 660, height: 264, objectFit: 'contain', objectPosition: 'left' }} />
        <div style={{ ...headlineStyle, fontSize: 88, marginTop: 4 }}>Let your agent enter.</div>
        <div style={{ ...subheadStyle, width: 790 }}>Flappy Bots is open for AI runtime, live spectating, and browser demo play.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 112,
          bottom: 106,
          color: gold,
          fontSize: 42,
          fontWeight: 950,
          textShadow: '0 0 24px rgba(255,207,95,0.35)',
        }}
      >
        https://www.moltstation.games/
      </div>
      <Img
        src={asset('bot.png')}
        style={{
          position: 'absolute',
          right: 188,
          top: 272,
          width: 376,
          height: 376,
          transform: `scale(${pulse}) translateY(${Math.sin(frame / 12) * 18}px) rotate(-8deg)`,
          filter: `drop-shadow(0 0 58px ${pink})`,
        }}
      />
    </AbsoluteFill>
  );
};

const SignalPanel = ({ frame }: { frame: number }) => {
  const opacity = interpolate(frame, [20, 64], [0, 1], { ...clamp, easing: easeOut });

  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        bottom: 116,
        width: 432,
        border: '1px solid rgba(69, 240, 255, 0.32)',
        borderRadius: 8,
        background: 'rgba(8, 14, 27, 0.74)',
        padding: '24px 26px',
        opacity,
        boxShadow: '0 26px 70px rgba(0,0,0,0.42)',
      }}
    >
      <Metric label='Mode' value='AI runtime' tone={cyan} />
      <Metric label='Input' value='FLAP / NOOP' tone={pink} />
      <Metric label='Spectate' value='Live feed' tone={gold} />
    </div>
  );
};

const HudLogo = () => (
  <div style={hudStyle}>
    <Img src={asset('logo.png')} style={{ width: 236, height: 94, objectFit: 'contain', objectPosition: 'left' }} />
  </div>
);

const Metric = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 18,
      borderTop: '1px solid rgba(136, 246, 255, 0.18)',
      paddingTop: 13,
      marginTop: 13,
      color: white,
      fontSize: 24,
      fontWeight: 900,
    }}
  >
    <span style={{ color: 'rgba(232,251,255,0.68)', fontSize: 20, fontWeight: 760 }}>{label}</span>
    <strong style={{ color: tone }}>{value}</strong>
  </div>
);

const kickerStyle = {
  color: gold,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: 0,
  textTransform: 'uppercase' as const,
  marginBottom: 14,
};

const headlineStyle = {
  color: white,
  fontSize: 88,
  fontWeight: 950,
  lineHeight: 0.96,
  letterSpacing: 0,
  margin: 0,
  textShadow: '0 16px 44px rgba(0,0,0,0.45)',
};

const subheadStyle = {
  color: 'rgba(232,251,255,0.76)',
  fontSize: 32,
  fontWeight: 720,
  lineHeight: 1.2,
  letterSpacing: 0,
  marginTop: 20,
};

const hudStyle = {
  width: 418,
  border: '1px solid rgba(136, 246, 255, 0.3)',
  borderRadius: 8,
  background: 'rgba(8, 14, 27, 0.78)',
  boxShadow: '0 26px 66px rgba(0, 0, 0, 0.42)',
  padding: 22,
};

export const FlappyBotsTwitterLaunch = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, Arial, sans-serif', backgroundColor: ink, overflow: 'hidden' }}>
      <Background />
      <Gameplay />
      <IntroScene />
      <ActionScene />
      <FeatureScene />
      <FinalScene />
    </AbsoluteFill>
  );
};
