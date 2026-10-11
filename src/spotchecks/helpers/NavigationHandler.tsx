import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { execute } from './executables';
import { captureP1Error } from './sentry';

// Focused route keys from the root down, walking into nested navigators (tabs/stacks).
export function getFocusedRoutePath(state: any): string[] {
  const path: string[] = [];
  let current = state;
  while (current?.routes?.length) {
    // Partial stack state has no index; its focused route is the last one.
    const index = current.index ?? (current.type === 'stack' ? current.routes.length - 1 : 0);
    const route = current.routes[index];
    if (!route) break;
    path.push(String(route.key ?? route.name));
    current = route.state;
  }
  return path;
}

// Focused screen key (deepest route); a new key = a new screen.
export function getFocusedRouteKey(state: any): string | null {
  const path = getFocusedRoutePath(state);
  return path.length ? path[path.length - 1]! : null;
}

// Same screen when a nested navigator just mounted under the focused route.
function isNestedMount(previous: string[], current: string[]): boolean {
  return previous.length > 0
    && current.length > previous.length
    && previous.every((key, i) => current[i] === key);
}

// Closes an open spotcheck when the focused screen changes.
export function useSpotcheckNavigation() {
  const navigation = useNavigation();
  const previousRoute = useRef<string[] | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      try {
        const currentRoute = getFocusedRoutePath(navigation.getState());
        const previous = previousRoute.current;
        // Legacy: starts from null, so the first navigation also closes.
        const changed = previous === null
          || (previous.join('/') !== currentRoute.join('/') && !isNestedMount(previous, currentRoute));
        if (changed) {
          execute('handleNavigationChange');
        }
        previousRoute.current = currentRoute;
      } catch (error: any) {
        captureP1Error(error, 'GENERAL', { action: 'navigationListener', errorMessage: error?.message });
      }
    });
    return unsubscribe;
  }, [navigation]);
}
