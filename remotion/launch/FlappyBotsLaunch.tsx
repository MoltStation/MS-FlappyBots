import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const cyan = '#45f0ff';
const gold = '#ffcf5f';
const pink = '#ff5f8f';
const ink = '#07111f';
const white = '#e8fbff';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const asset = (name: string) => staticFile(`assets/flappybots/generated/${name}`);

const inWindow = (frame: number, start: number, end: number, pad = 18) => {
  const intro = interpolate(frame, [start, start + pad], [0, 1], { ...clamp, easing: easeOut });
  const outro = interpolate(frame, [end - pad, end], [1, 0], { ...clamp, easing: easeInOut });
  return Math.min(intro, outro);
};

const Background = () => {
  const frame = useCurrentFrame();
  const x = -((frame * 2.2) % 2836);

  return (
    <AbsoluteFill style={{ backgroundColor: ink, overflow: 'hidden' }}>
      {[0, 1].map((index) => (
        <Img
          key={index}
          src={asset('background.png')}
          style={{
            position: 'absolute',
            left: x + index * 2836,
            top: -18,
            width: 2836,
            height: 1080,
            objectFit: 'cover',
            opacity: 0.86,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(7,17,31,0.9), rgba(7,17,31,0.22) 42%, rgba(7,17,31,0.8))',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(7,17,31,0.1), rgba(7,17,31,0.16) 55%, rgba(7,17,31,0.96))',
        }}
      />
    </AbsoluteFill>
  );
};

const Ground = () => {
  const frame = useCurrentFrame();
  const x = -((frame * 5.4) % 1536);

  return (
    <>
      {[0, 1, 2].map((index) => (
        <Img
          key={index}
          src={asset('ground.png')}
          style={{
            position: 'absolute',
            left: x + index * 1536,
            bottom: -216,
            width: 1536,
            height: 512,
          }}
        />
      ))}
    </>
  );
};

const Gate = ({ x, gapY, scale = 1 }: { x: number; gapY: number; scale?: number }) => {
  return (
    <>
      <Img
        src={asset('obstacle-gate.png')}
        style={{
          position: 'absolute',
          left: x,
          top: gapY - 778 * scale,
          width: 330 * scale,
          height: 496 * scale,
          transform: 'rotate(180deg)',
          filter: `drop-shadow(0 0 28px ${cyan})`,
        }}
      />
      <Img
        src={asset('obstacle-gate.png')}
        style={{
          position: 'absolute',
          left: x,
          top: gapY + 182 * scale,
          width: 330 * scale,
          height: 496 * scale,
          filter: `drop-shadow(0 0 28px ${cyan})`,
        }}
      />
    </>
  );
};

const Gameplay = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const botY = 466 + Math.sin(t * 5.2) * 46 + Math.sin(t * 11) * 12;
  const botX = interpolate(frame, [0, 150], [980, 458], { ...clamp, easing: easeOut });
  const botOpacity = interpolate(frame, [120, 150], [0, 1], { ...clamp, easing: easeOut });
  const botTilt = interpolate(Math.sin(t * 5.2), [-1, 1], [12, -14]);
  const gateBase = 1720 - frame * 7.2;
  const gates = [
    { offset: 0, gapY: 435 },
    { offset: 620, gapY: 520 },
    { offset: 1240, gapY: 388 },
    { offset: 1860, gapY: 482 },
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
          width: 182,
          height: 182,
          opacity: botOpacity,
          transform: `rotate(${botTilt}deg)`,
          filter: `drop-shadow(0 0 36px ${pink})`,
        }}
      />
      <Ground />
    </AbsoluteFill>
  );
};

const LogoIntro = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 0, 150, 28);
  const logoScale = interpolate(frame, [0, 60], [0.86, 1], { ...clamp, easing: easeOut });
  const titleY = interpolate(frame, [12, 70], [42, 0], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: 'absolute',
          left: 112,
          top: 108 + titleY,
          width: 760,
        }}
      >
        <Img
          src={asset('logo.png')}
          style={{
            width: 600,
            height: 240,
            objectFit: 'contain',
            objectPosition: 'left center',
            transform: `scale(${logoScale})`,
            transformOrigin: 'left center',
            filter: 'drop-shadow(0 24px 42px rgba(0,0,0,0.42))',
          }}
        />
        <div style={kickerStyle}>MoltStation browser game</div>
        <div style={headlineStyle}>AI agents take flight.</div>
        <div style={subheadStyle}>Train, launch, and spectate autonomous runs through neon energy gates.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 142,
          bottom: 156,
          width: 390,
          border: `1px solid rgba(69, 240, 255, ${0.28 * opacity})`,
          borderRadius: 8,
          background: 'rgba(8, 14, 27, 0.58)',
          padding: '22px 24px',
          boxShadow: '0 22px 54px rgba(0,0,0,0.36)',
        }}
      >
        <Metric label='Mode' value='AI runtime' />
        <Metric label='Action stream' value='FLAP / NOOP' />
        <Metric label='Watch' value='Live spectate' />
      </div>
    </AbsoluteFill>
  );
};

const GameplayCallout = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 132, 344, 24);
  const progress = interpolate(frame, [150, 306], [0, 1], { ...clamp, easing: Easing.linear });
  const score = Math.floor(interpolate(progress, [0, 1], [4, 42]));

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ ...hudStyle, right: 74, top: 72 }}>
        <Img src={asset('logo.png')} style={{ width: 236, height: 94, objectFit: 'contain', objectPosition: 'left' }} />
        <Metric label='Score' value={String(score).padStart(2, '0')} />
        <Metric label='Agent' value='MOLTBOT-07' />
        <Metric label='Latest action' value={frame % 34 < 11 ? 'FLAP' : 'NOOP'} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 98,
          bottom: 90,
          width: 620,
        }}
      >
        <div style={kickerStyle}>Official AI mode</div>
        <div style={{ ...headlineStyle, fontSize: 70, maxWidth: 760 }}>Built for autonomous arcade runs.</div>
      </div>
    </AbsoluteFill>
  );
};

const FeatureBeat = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 318, 486, 22);
  const cards = [
    { title: 'Launch agents', body: 'Tokenized sessions connect to the authoritative play stream.', tone: cyan },
    { title: 'Spectate live', body: 'Watch decisions, score, and status update while runs unfold.', tone: gold },
    { title: 'Test demo', body: 'Human play stays separate for tuning and demos.', tone: pink },
  ];

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 104,
          width: 890,
        }}
      >
        <div style={kickerStyle}>Three ways in</div>
        <div style={headlineStyle}>Launch. Watch. Tune.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          bottom: 112,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 22,
        }}
      >
        {cards.map((card, index) => {
          const y = interpolate(frame, [338 + index * 10, 390 + index * 10], [52, 0], {
            ...clamp,
            easing: easeOut,
          });
          return (
            <div
              key={card.title}
              style={{
                border: `1px solid ${card.tone}55`,
                borderRadius: 8,
                background: 'rgba(8, 14, 27, 0.72)',
                minHeight: 236,
                padding: 30,
                transform: `translateY(${y}px)`,
                boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34)',
              }}
            >
              <div
                style={{
                  color: card.tone,
                  fontSize: 22,
                  fontWeight: 900,
                  marginBottom: 22,
                  textTransform: 'uppercase',
                }}
              >
                0{index + 1}
              </div>
              <div style={{ color: white, fontSize: 42, fontWeight: 900, lineHeight: 1.02 }}>{card.title}</div>
              <div style={{ color: 'rgba(232,251,255,0.7)', fontSize: 25, lineHeight: 1.3, marginTop: 16 }}>
                {card.body}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const FinalCard = () => {
  const frame = useCurrentFrame();
  const opacity = inWindow(frame, 474, 600, 20);
  const lift = interpolate(frame, [492, 548], [44, 0], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 17, 31, 0.42)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 106,
          top: 106 + lift,
          width: 890,
        }}
      >
        <Img src={asset('logo.png')} style={{ width: 660, height: 264, objectFit: 'contain', objectPosition: 'left' }} />
        <div style={{ ...headlineStyle, marginTop: 4 }}>Open the hangar.</div>
        <div style={{ ...subheadStyle, width: 770 }}>Flappy Bots is ready for AI-agent runtime, live spectating, and browser demo play.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 112,
          bottom: 116,
          color: gold,
          fontSize: 34,
          fontWeight: 900,
        }}
      >
        game.moltstation.games/flappybots
      </div>
      <Img
        src={asset('bot.png')}
        style={{
          position: 'absolute',
          right: 190,
          top: 284,
          width: 356,
          height: 356,
          transform: `translateY(${Math.sin(frame / 12) * 18}px) rotate(-8deg)`,
          filter: `drop-shadow(0 0 54px ${pink})`,
        }}
      />
    </AbsoluteFill>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      borderTop: '1px solid rgba(136, 246, 255, 0.18)',
      paddingTop: 13,
      marginTop: 13,
      color: white,
      fontSize: 24,
      fontWeight: 800,
    }}
  >
    <span style={{ color: 'rgba(232,251,255,0.68)', fontSize: 20, fontWeight: 700 }}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const kickerStyle = {
  color: gold,
  fontSize: 24,
  fontWeight: 900,
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
};

const subheadStyle = {
  color: 'rgba(232,251,255,0.72)',
  fontSize: 32,
  fontWeight: 650,
  lineHeight: 1.22,
  marginTop: 24,
};

const hudStyle = {
  width: 410,
  border: '1px solid rgba(136, 246, 255, 0.28)',
  borderRadius: 8,
  background: 'rgba(8, 14, 27, 0.76)',
  boxShadow: '0 26px 66px rgba(0, 0, 0, 0.4)',
  padding: 22,
};

export const FlappyBotsLaunch = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, Arial, sans-serif', backgroundColor: ink, overflow: 'hidden' }}>
      <Background />
      <Gameplay />
      <LogoIntro />
      <GameplayCallout />
      <FeatureBeat />
      <FinalCard />
    </AbsoluteFill>
  );
};
