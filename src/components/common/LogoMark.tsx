import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type LogoMarkProps = {
  size?: number;
  monochrome?: boolean;
};

export function LogoMark({ size = 72, monochrome = false }: LogoMarkProps) {
  const primary = monochrome ? '#F5F7FF' : '#A855F7';
  const secondary = monochrome ? '#F5F7FF' : '#8B3DFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 128 128">
      <Defs>
        <SvgLinearGradient id="logoGlow" x1="16" y1="12" x2="112" y2="118">
          <Stop offset="0" stopColor={primary} />
          <Stop offset="0.55" stopColor={secondary} />
          <Stop offset="1" stopColor="#5B21B6" />
        </SvgLinearGradient>
      </Defs>
      <G>
        <Path
          d="M64 9 112 36v56l-48 27-48-27V36L64 9Z"
          fill="rgba(139,61,255,0.08)"
          stroke="url(#logoGlow)"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <Path
          d="M64 31 90 46v31L64 93 38 77V46l26-15Z"
          fill="rgba(168,85,247,0.10)"
          stroke={primary}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <Path
          d="M51 57h26a8 8 0 0 1 8 8v7a8 8 0 0 1-8 8H64l-12 9v-9h-1a8 8 0 0 1-8-8v-7a8 8 0 0 1 8-8Z"
          fill="#07070B"
          stroke={secondary}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <Path
          d="M55 58v-7a9 9 0 0 1 18 0v7"
          fill="none"
          stroke="#19D98E"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Rect x="54" y="59" width="20" height="17" rx="5" fill="#19D98E" opacity="0.92" />
        <Circle cx="64" cy="68" r="3" fill="#07070B" />
      </G>
    </Svg>
  );
}
