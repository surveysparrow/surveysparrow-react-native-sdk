import React from 'react';

class ComponentRegistry {
  private components: Record<string, React.ComponentType<any>> = {};

  register(name: string, component: React.ComponentType<any>) {
    this.components[name] = component;
  }

  get(name: string): React.ComponentType<any> | undefined {
    return this.components[name];
  }
}

export const componentRegistry = new ComponentRegistry();
