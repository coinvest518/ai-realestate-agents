import React from 'react'
import ReactDOM from 'react-dom/client'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import ChatPanel from '../chat-panel'
import { vi } from 'vitest'

let root: any
let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = ReactDOM.createRoot(container)
})

afterEach(() => {
  if (root) {
    root.unmount()
    // @ts-ignore
    root = null
  }
  if (container && container.parentNode) {
    container.parentNode.removeChild(container)
  }
})

test('chat detects people-search intent and asks for confirmation', async () => {
  root.render(<ChatPanel pollTask={vi.fn()} browserActReady={true} />)

  const input = screen.getByPlaceholderText(/Find John Doe \/ Search Mike Smith limit 10/i) as HTMLInputElement
  fireEvent.change(input, { target: { value: 'Find John Doe' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

  // assistant should ask to confirm running the people search
  await waitFor(() => {
    expect(screen.getByText(/I can run a people search for "john doe"/i)).toBeInTheDocument()
  })
})

test('greeting triggers conversational LLM reply (no people-search)', async () => {
  const originalFetch = global.fetch
  const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: 'Hi — how can I help?' }) })
  // @ts-ignore
  global.fetch = mockFetch

  root.render(<ChatPanel pollTask={vi.fn()} browserActReady={true} />)
  const input = screen.getByPlaceholderText(/Find John Doe \/ Search Mike Smith limit 10/i) as HTMLInputElement
  fireEvent.change(input, { target: { value: 'hello' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

  await waitFor(() => {
    expect(screen.getByText(/Hi — how can I help\?/i)).toBeInTheDocument()
  })

  // restore
  // @ts-ignore
  global.fetch = originalFetch
})