import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { WebViewRenderer } from './WebViewRenderer';
import { componentRegistry } from './ComponentRegistry';
import { SafeAreaView, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { captureP1Error } from '../helpers/sentry';
import { execute, hasFunction } from '../helpers/executables';

interface SchemaNode {
  type: string;
  props?: Record<string, any>;
  children?: SchemaNode[];
  if?: any;
  slot?: string;
  component?: string;
  meta?: { componentRole?: string; [key: string]: unknown };
  content?: any;
}

interface BuilderContext {
  state?: any;
  styles?: any;
  slots?: Record<string, React.ReactNode>;
  handlers?: Record<string, (...args: any[]) => void>;
}

interface BuilderProps {
  schema: SchemaNode | SchemaNode[] | null;
  context: BuilderContext;
}

function computeCloseButtonHitSlop(styles: Record<string, any> | undefined): {
  top: number;
  left: number;
  bottom: number;
  right: number;
} | undefined {
  if (!styles) return undefined;
  const tap = styles.closeButtonMinimumTapTarget as { minWidth?: number; minHeight?: number } | undefined;
  const container = styles.closeButtonContainerStyle as { width?: number; height?: number } | undefined;
  if (!tap || !container) return undefined;
  const minW = Number(tap.minWidth) || 44;
  const minH = Number(tap.minHeight) || 44;
  const w = Number(container.width) || 0;
  const h = Number(container.height) || 0;
  if (w <= 0 || h <= 0) return undefined;
  const dh = Math.max(0, (minW - w) / 2);
  const dv = Math.max(0, (minH - h) / 2);
  return { top: dv, bottom: dv, left: dh, right: dh };
}

function mergeCloseButtonTouchTargetProps(
  node: SchemaNode,
  context: BuilderContext,
  resolvedProps: Record<string, any>
): Record<string, any> {
  if (node.meta?.componentRole !== 'closeButton') {
    return resolvedProps;
  }
  const hitSlop = computeCloseButtonHitSlop(context.styles);
  if (!hitSlop) {
    return resolvedProps;
  }
  return { ...resolvedProps, hitSlop };
}

// Uniform tap feedback on every platform: dim while pressed (backend can set pressedOpacity).
const DEFAULT_PRESSED_OPACITY = 0.6;

const FeedbackTouchable = ({ pressedOpacity, ...props }: any) => (
  <TouchableOpacity activeOpacity={pressedOpacity ?? DEFAULT_PRESSED_OPACITY} {...props} />
);

const FeedbackPressable = ({ pressedOpacity, style, ...props }: any) => (
  <Pressable
    {...props}
    style={({ pressed }) => [style, pressed && { opacity: pressedOpacity ?? DEFAULT_PRESSED_OPACITY }]}
  />
);

componentRegistry.register('View', View);
componentRegistry.register('TouchableOpacity', FeedbackTouchable);
componentRegistry.register('Text', Text);
componentRegistry.register('Image', Image);
componentRegistry.register('Pressable', FeedbackPressable);
const EDGE_KEYS = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' } as const;
type Edge = keyof typeof EDGE_KEYS;

// Insets from the provider on the first render (legacy useSafeAreaInsets); the native view applies them a frame late, so positioned buttons jumped.
const InsetSafeAreaView = ({ edges, mode, style, ...props }: any) => {
  const insets = React.useContext(SafeAreaInsetsContext);
  if (!insets) return <SafeAreaView edges={edges} mode={mode} style={style} {...props} />;
  const list: Edge[] = Array.isArray(edges)
    ? edges
    : edges && typeof edges === 'object'
      ? (Object.keys(edges) as Edge[]).filter((e) => edges[e] !== 'off')
      : ['top', 'right', 'bottom', 'left'];
  const prefix = mode === 'margin' ? 'margin' : 'padding';
  const flat: Record<string, any> = StyleSheet.flatten(style) || {};
  const extra: Record<string, number> = {};
  for (const edge of list) {
    if (!(edge in EDGE_KEYS)) continue;
    const axis = edge === 'top' || edge === 'bottom' ? 'Vertical' : 'Horizontal';
    const key = `${prefix}${EDGE_KEYS[edge]}`;
    const base = flat[key] ?? flat[`${prefix}${axis}`] ?? flat[prefix];
    extra[key] = (typeof base === 'number' ? base : 0) + (insets[edge] || 0);
  }
  return <View style={[style, extra]} {...props} />;
};

componentRegistry.register('SafeAreaView', InsetSafeAreaView);
componentRegistry.register('SvgXml', SvgXml);
componentRegistry.register('WebViewRenderer', WebViewRenderer as any);

const evaluateExpression = (expr: string, context: BuilderContext): any => {
  try {
    const safeContext = {
      state: context.state,
      styles: context.styles,
      Math: Math,
    };
    
    const func = new Function(...Object.keys(safeContext), `return ${expr}`);
    return func(...Object.values(safeContext));
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', {
      action: 'evaluateExpression',
      expression: expr?.substring(0, 200),
      errorMessage: error?.message,
    });
    return undefined;
  }
};

const resolveBinding = (value: any, context: BuilderContext): any => {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item) => resolveBinding(item, context));
    }

    if (value.$expr) {
      return evaluateExpression(value.$expr, context);
    }

    if (value.$ref) {
      const path = value.$ref.split('.');
      let result = context;
      for (const key of path) {
        result = result?.[key as keyof BuilderContext];
      }
      return result;
    }
    
    if (value.$path) {
      const path = value.$path.split('.');
      let result = context.state;
      for (const key of path) {
        result = result?.[key];
      }
      return result;
    }

    if (value.$handler && context.handlers) {
      return context.handlers[value.$handler];
    }

    // Generic action: `{ $execute: 'group.fn', args: {...} }` runs a backend function; unknown names do nothing.
    if (typeof value.$execute === 'string') {
      const functionName = value.$execute;
      const args = value.args && typeof value.args === 'object' ? value.args : {};
      return (event?: any) => {
        if (!functionName || !hasFunction(functionName)) return;
        const nativeEvent = event?.nativeEvent;
        const eventData = nativeEvent && typeof nativeEvent === 'object' ? { ...nativeEvent } : undefined;
        execute(functionName, eventData ? { ...args, event: eventData } : { ...args }).catch(() => {});
      };
    }

    if (value.$handlers && Array.isArray(value.$handlers) && context.handlers) {
      return (...args: any[]) => {
        value.$handlers.forEach((handlerName: string) => {
          const handler = context.handlers?.[handlerName];
          if (handler) {
            handler(...args);
          }
        });
      };
    }

    const resolved: Record<string, any> = {};
    for (const key in value) {
      resolved[key] = resolveBinding(value[key], context);
    }
    return resolved;
  }
  
  return value;
};

const evaluateCondition = (condition: any, context: BuilderContext): boolean => {
  if (!condition) return true;
  
  if (typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.$and && Array.isArray(condition.$and)) {
      return condition.$and.every((cond: any) => evaluateCondition(cond, context));
    }
    
    if (condition.$or && Array.isArray(condition.$or)) {
      return condition.$or.some((cond: any) => evaluateCondition(cond, context));
    }
    
    if (condition.$not !== undefined) {
      return !evaluateCondition(condition.$not, context);
    }
    
    if (condition.$eq && Array.isArray(condition.$eq) && condition.$eq.length === 2) {
      const [left, right] = condition.$eq.map((val: any) => resolveBinding(val, context));
      return left === right;
    }
    
    if (condition.$ne && Array.isArray(condition.$ne) && condition.$ne.length === 2) {
      const [left, right] = condition.$ne.map((val: any) => resolveBinding(val, context));
      return left !== right;
    }

    if (condition.$gt && Array.isArray(condition.$gt) && condition.$gt.length === 2) {
      const [left, right] = condition.$gt.map((val: any) => resolveBinding(val, context));
      return left > right;
    }

    if (condition.$lt && Array.isArray(condition.$lt) && condition.$lt.length === 2) {
      const [left, right] = condition.$lt.map((val: any) => resolveBinding(val, context));
      return left < right;
    }
  }
  
  const resolved = resolveBinding(condition, context);
  return Boolean(resolved);
};

const renderNode = (node: SchemaNode, context: BuilderContext, key: string): React.ReactNode => {
  if (node.slot && context.slots) {
    return context.slots[node.slot] || null;
  }

  if (node.if !== undefined && !evaluateCondition(node.if, context)) {
    return null;
  }

  const Component = componentRegistry.get(node.type);
  if (!Component) {
    return null;
  }

  let resolvedProps: Record<string, any> = node.props ? resolveBinding(node.props, context) : {};
  resolvedProps = mergeCloseButtonTouchTargetProps(node, context, resolvedProps);

  const hasContentProperty = (node as any).content !== undefined;
  const content = hasContentProperty ? resolveBinding((node as any).content, context) : null;

  const children = node.children?.map((child, index) => 
    renderNode(child, context, `${key}-${index}`)
  );

  return (
    <Component key={key} {...resolvedProps}>
      {hasContentProperty ? content : children}
    </Component>
  );
};

export const Builder: React.FC<BuilderProps> = ({ schema, context }) => {
  if (!schema) {
    return null;
  }

  if (Array.isArray(schema)) {
    return (
      <>
        {schema.map((node, index) => renderNode(node, context, `root-${index}`))}
      </>
    );
  }

  return <>{renderNode(schema, context, 'root')}</>;
};
