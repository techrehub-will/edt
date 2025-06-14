interface WorkboxWindow {
  register(): Promise<void>
  addEventListener(event: string, handler: () => void): void
  messageSkipWaiting(): void
}

declare global {
  interface Window {
    workbox?: WorkboxWindow
  }
}

export {}
