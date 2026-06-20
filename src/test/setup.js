import '@testing-library/jest-dom'

// localStorage mock
const lsStore = {}
global.localStorage = {
  getItem: (k) => lsStore[k] ?? null,
  setItem: (k, v) => { lsStore[k] = String(v) },
  removeItem: (k) => { delete lsStore[k] },
  clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]) },
}

// sessionStorage mock
const ssStore = {}
global.sessionStorage = {
  getItem: (k) => ssStore[k] ?? null,
  setItem: (k, v) => { ssStore[k] = String(v) },
  removeItem: (k) => { delete ssStore[k] },
  clear: () => { Object.keys(ssStore).forEach((k) => delete ssStore[k]) },
}

// crypto.subtle mock for SHA-256 (jsdom exposes crypto as a getter, must use defineProperty)
Object.defineProperty(global, 'crypto', {
  writable: true,
  configurable: true,
  value: {
    subtle: {
      digest: async (_algo, data) => {
        // deterministic fake hash: XOR bytes into 32-byte buffer
        const input = new Uint8Array(data)
        const out = new Uint8Array(32)
        input.forEach((b, i) => { out[i % 32] ^= b })
        return out.buffer
      },
    },
  },
})

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

global.URL.createObjectURL = () => 'blob:mock'
global.URL.revokeObjectURL = () => {}
