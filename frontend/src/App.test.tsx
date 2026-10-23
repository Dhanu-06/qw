import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Survey dashboard statistics', () => {
  it('displays statistics returned by the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).endsWith('/stats')) {
          return {
            ok: true,
            json: async () => ({
              total: 103,
              drafts: 75,
              published: 17,
            }),
          }
        }

       return {
  ok: true,
  json: async () => ({
    surveys: [],
    page: 1,
    totalPages: 1,
  }),
}
      }),
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByText('Total surveys')).toBeInTheDocument()
      expect(screen.getByText('Drafts')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
    })

    const totalCard = screen.getByText('Total surveys').closest('article')
    const draftsCard = screen.getByText('Drafts').closest('article')
    const publishedCard = screen.getByText('Published').closest('article')

    expect(totalCard).toHaveTextContent('103')
    expect(draftsCard).toHaveTextContent('75')
    expect(publishedCard).toHaveTextContent('17')
  })

  it('shows a loading message while statistics are being fetched', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () => new Promise(() => {}),
      ),
    )

    renderApp()

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument()
  })

  it('shows an error message when the statistics request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    )

    renderApp()

    await waitFor(() => {
  expect(screen.getAllByText('Network error').length).toBeGreaterThan(0)
})
  })
})
