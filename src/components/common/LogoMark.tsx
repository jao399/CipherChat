import { Image, StyleSheet } from 'react-native';

type LogoMarkProps = {
  size?: number;
  monochrome?: boolean;
};

const exactOfficialLogo = require('../../assets/logo/cipherchat-official-logo.png');

export function LogoMark({ size = 72 }: LogoMarkProps) {
  return (
    <Image
      source={exactOfficialLogo}
      resizeMode="contain"
      style={[styles.image, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
});
