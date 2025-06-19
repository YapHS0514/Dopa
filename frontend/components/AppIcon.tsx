import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface AppIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export const AppIcon = ({ width = 120, height = 120, color = '#4285F4' }: AppIconProps) => (
  <Svg width={width} height={height} viewBox="0 0 120 120">
    <Circle cx="60" cy="60" r="60" fill={color} />
    <G fill="white">
      {/* Stylized "D" for Dopa */}
      <Path
        d="M40 30h20c16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30H40V30zm20 50c11.046 0 20-8.954 20-20s-8.954-20-20-20H50v40h10z"
      />
      {/* Dopamine molecule representation */}
      <Circle cx="45" cy="45" r="4" />
      <Circle cx="75" cy="45" r="4" />
      <Circle cx="60" cy="75" r="4" />
      <Path
        d="M45 45L75 45M60 75L75 45M60 75L45 45"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
    </G>
  </Svg>
); 