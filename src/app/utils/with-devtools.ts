import { effect, isDevMode } from '@angular/core';
import { getState, signalStoreFeature, withHooks } from '@ngrx/signals';

// ---------------------------------------------------------------------------
// Minimal Redux DevTools Extension typings
// ---------------------------------------------------------------------------

interface DevtoolsConnection {
  init(state: unknown): void;
  send(action: { type: string }, state: unknown): void;
}

interface ReduxDevtoolsExtension {
  connect(options: { name: string }): DevtoolsConnection;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevtoolsExtension;
  }
}

// ---------------------------------------------------------------------------
// withDevtools – reusable SignalStore feature
//
// Usage: add withDevtools('StoreName') as the last feature in signalStore(...)
//
// Only active in development mode and when the Redux DevTools browser
// extension is installed. No @ngrx/store required.
// ---------------------------------------------------------------------------

export function withDevtools(name: string) {
  return signalStoreFeature(
    withHooks({
      // onInit runs inside an Angular injection context, so effect() is safe here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInit(store: any) {
        if (!isDevMode()) return;

        const extension = typeof window !== 'undefined'
          ? window.__REDUX_DEVTOOLS_EXTENSION__
          : undefined;

        if (!extension) return;

        const devtools = extension.connect({ name });

        // Send the initial state immediately
        devtools.init(getState(store));

        // Re-send on every state change
        effect(() => {
          devtools.send({ type: `[${name}] Update` }, getState(store));
        });
      },
    }),
  );
}

