import React from 'react';
import { Pressable, Text, StyleSheet, View, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SpotCheckButtonProps {
  config: any;
  onPress: () => void;
}

const hexToRgba = (hex: string, opacity: number) => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;

  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const value = parseInt(c.join(''), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${
    value & 255
  },${opacity})`;
};

const renderIcon = (icon: string, buttonSize: string, type?: string) => {
  const size =
    type === 'floatingButton'
      ? getSizeValue(buttonSize)
      : getSizeValueTextButton(buttonSize);

  if (!icon) return null;

  const isImage = icon.startsWith('http');

  if (isImage) {
    return (
      <Image
        source={{ uri: icon }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          resizeMode: 'fill',
        }}
      />
    );
  }

  return <SvgXml xml={icon} />;
};

const SIZE_MAP = { small: 28, medium: 32, large: 40 };
const SIZE_MAP_TEXTBUTTON = { small: 16, medium: 20, large: 24 };
const BORDER_RADIUS_MAP = {
  sharp: { small: 4, medium: 6, large: 8 },
  soft: { small: 8, medium: 12, large: 16 },
  smooth: { small: 24, medium: 16, large: 24 },
};

const getSizeValue = (buttonSize: string) =>
  SIZE_MAP[buttonSize as keyof typeof SIZE_MAP] || SIZE_MAP.medium;

const getSizeValueTextButton = (buttonSize: string) =>
  SIZE_MAP_TEXTBUTTON[buttonSize as keyof typeof SIZE_MAP_TEXTBUTTON] ||
  SIZE_MAP_TEXTBUTTON.medium;

const getBorderRadius = (cornerRadius: string, buttonSize: string) => {
  const radiusType = cornerRadius || 'sharp';
  const size = buttonSize || 'medium';
  return (
    BORDER_RADIUS_MAP[radiusType as keyof typeof BORDER_RADIUS_MAP]?.[
      size as keyof typeof BORDER_RADIUS_MAP.sharp
    ] || 6
  );
};

const getTextStyle = (buttonSize: string) => {
  if (buttonSize === 'small') return styles.textSmall;
  if (buttonSize === 'large') return styles.textLarge;
  return styles.textMedium;
};

const getPositionStyle = (position: string) => {
  if (!position) return {};
  const [vertical, horizontal] = position.split('_');
  const positionStyle: any = { position: 'absolute', zIndex: 1000000 };

  if (vertical === 'top') positionStyle.top = 16;
  if (vertical === 'bottom') positionStyle.bottom = 16;
  if (vertical === 'center') positionStyle.top = '50%';
  if (horizontal === 'left') positionStyle.left = 16;
  if (horizontal === 'right') positionStyle.right = 16;

  return positionStyle;
};

const RenderFloatingButton: React.FC<SpotCheckButtonProps> = ({
  config,
  onPress,
}) => {
  const { position, buttonSize, generatedIcon, backgroundColor, icon } = config;
  const size = getSizeValue(buttonSize);
  const innerBorderWidth = 4;
  const outerBorderWidth = 4;
  const bgColor = backgroundColor || '#4A9CA6';
  const containerSize = size + innerBorderWidth * 2 + outerBorderWidth * 2;

  const positionStyle = position
    ? getPositionStyle(position)
    : { position: 'absolute', zIndex: 1000000 };

  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          marginBottom: insets.bottom,
          marginTop: insets.top,
          marginLeft: insets.left,
          marginRight: insets.right,
        },
        positionStyle,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: hexToRgba(bgColor, 0.25),
          padding: outerBorderWidth,
        },
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: (containerSize - outerBorderWidth * 2) / 2,
          backgroundColor: hexToRgba(bgColor, 0.5),
          padding: innerBorderWidth,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onPress}
        >
          {renderIcon(generatedIcon || icon, buttonSize, 'floatingButton')}
        </Pressable>
      </View>
    </View>
  );
};

const RenderSideTab: React.FC<SpotCheckButtonProps> = ({ config, onPress }) => {
  const {
    position,
    buttonSize,
    icon,
    generatedIcon,
    backgroundColor,
    cornerRadius,
    textColor,
    buttonText,
  } = config;
  const [buttonWidth, setButtonWidth] = React.useState(0);

  const handleLayout = (event: any) => {
    if (buttonWidth === 0) {
      setButtonWidth(event.nativeEvent.layout.width);
    }
  };

  const sizeStyle =
    buttonSize === 'small'
      ? styles.sideTabSmall
      : buttonSize === 'large'
        ? styles.sideTabLarge
        : styles.sideTabMedium;
  const textStyle = getTextStyle(buttonSize);
  const borderRadiusValue = getBorderRadius(cornerRadius, buttonSize);

  const radiusStyle = {
    borderTopLeftRadius: borderRadiusValue,
    borderTopRightRadius: borderRadiusValue,
  };

  const insets = useSafeAreaInsets();

  const transforms: any[] = [];
  const positionStyle: any = { position: 'absolute', zIndex: 1000000 };

  if (position && buttonWidth > 0) {
    const [vertical, horizontal] = position.split('_');
    const height = (sizeStyle.paddingVertical || 0) * 2 + textStyle.lineHeight;

    if (vertical === 'top') {
      positionStyle.top = 16;
      transforms.push({ translateY: (buttonWidth - height) / 2 });
    } else if (vertical === 'bottom') {
      positionStyle.bottom = 16;
      transforms.push({ translateY: -(buttonWidth - height) / 2 });
    } else if (vertical === 'center') {
      positionStyle.top = '50%';
      transforms.push({ translateY: -(buttonWidth - height) / 4 });
    }

    if (horizontal === 'left') {
      positionStyle.left = 0;
      transforms.push(
        { translateX: (height - buttonWidth) / 2 },
        { rotate: '90deg' }
      );
    } else if (horizontal === 'right') {
      positionStyle.right = 0;
      transforms.push(
        { translateX: buttonWidth / 2 - height / 2 },
        { rotate: '-90deg' }
      );
    }
  }

  const style = [
    {
      marginBottom: insets.bottom,
      marginTop: insets.top,
      marginLeft: insets.left,
      marginRight: insets.right,
    },
    styles.base,
    styles.sideTab,
    sizeStyle,
    radiusStyle,
    positionStyle,
    { backgroundColor: backgroundColor || '#4A9CA6' },
    transforms.length > 0 && { transform: transforms },
    buttonWidth === 0 && { opacity: 0 },
  ];

  return (
    <Pressable style={style} onPress={onPress} onLayout={handleLayout}>
      {renderIcon(generatedIcon || icon, buttonSize)}
      <Text style={[textStyle, { color: textColor || '#FFFFFF' }]}>
        {buttonText || ''}
      </Text>
    </Pressable>
  );
};

const RenderTextButton: React.FC<SpotCheckButtonProps> = ({
  config,
  onPress,
}) => {
  const {
    position,
    buttonSize,
    generatedIcon,
    icon,
    backgroundColor,
    cornerRadius,
    textColor,
    buttonText,
  } = config;

  const sizeStyle =
    buttonSize === 'small'
      ? styles.textButtonSmall
      : buttonSize === 'large'
        ? styles.textButtonLarge
        : styles.textButtonMedium;
  const textStyle = getTextStyle(buttonSize);
  const borderRadiusValue = getBorderRadius(cornerRadius, buttonSize);
  const insets = useSafeAreaInsets();
  const style = [
    {
      marginBottom: insets.bottom,
      marginTop: insets.top,
      marginLeft: insets.left,
      marginRight: insets.right,
    },
    styles.base,
    styles.textButton,
    sizeStyle,
    getPositionStyle(position),
    {
      borderRadius: borderRadiusValue,
      backgroundColor: backgroundColor || '#4A9CA6',
    },
  ];

  return (
    <Pressable style={style} onPress={onPress}>
      {renderIcon(generatedIcon || icon, buttonSize)}
      <Text style={[textStyle, { color: textColor || '#FFFFFF' }]}>
        {buttonText || ''}
      </Text>
    </Pressable>
  );
};

const SpotCheckButton: React.FC<SpotCheckButtonProps> = ({
  config,
  onPress,
}) => {
  const { type } = config;

  switch (type) {
    case 'floatingButton':
      return <RenderFloatingButton config={config} onPress={onPress} />;
    case 'sideTab':
      return <RenderSideTab config={config} onPress={onPress} />;
    case 'textButton':
      return <RenderTextButton config={config} onPress={onPress} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    zIndex: 1000000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideTab: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideTabSmall: { paddingVertical: 4, paddingHorizontal: 8 },
  sideTabMedium: { paddingVertical: 6, paddingHorizontal: 12 },
  sideTabLarge: { paddingVertical: 10, paddingHorizontal: 16 },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  textButtonSmall: { paddingVertical: 4, paddingLeft: 8, paddingRight: 8 },
  textButtonMedium: { paddingVertical: 6, paddingLeft: 12, paddingRight: 12 },
  textButtonLarge: { paddingVertical: 10, paddingLeft: 16, paddingRight: 16 },
  textSmall: { fontFamily: 'DMSans-Bold', fontSize: 12, lineHeight: 16 },
  textMedium: { fontFamily: 'DMSans-Bold', fontSize: 14, lineHeight: 20 },
  textLarge: { fontFamily: 'DMSans-Bold', fontSize: 16, lineHeight: 24 },
});

export default SpotCheckButton;
