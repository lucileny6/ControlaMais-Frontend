import * as React from 'react';
import { Dimensions, ScaledSize } from 'react-native';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const { width } = Dimensions.get('window');
    setIsMobile(width < MOBILE_BREAKPOINT);

    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setIsMobile(window.width < MOBILE_BREAKPOINT);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isMobile;
}