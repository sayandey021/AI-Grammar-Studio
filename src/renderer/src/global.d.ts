export {};

declare global {
  interface Window {
    api: any; // We use any here to avoid cyclic dependency issues with preload for now
  }
}
