import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookmarksClient } from '../BookmarksClient'

// next-intl mock — returns the translation key as-is
vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string) => key,
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makeBookmark = (overrides: Partial<{
  id: string
  nextReviewAt: Date | null
  reviewCount: number
  score: number | null
  modelAnswer: string | null
  category: string
  difficulty: string
  content: string
}> = {}) => {
  const {
    id = 'bm-1',
    nextReviewAt = null,      // null → due now
    reviewCount = 0,
    score = 75,
    modelAnswer = 'Use a HashMap for O(1) lookups.',
    category = 'technical',
    difficulty = 'mid',
    content = 'What is the difference between HashMap and TreeMap?',
  } = overrides

  return {
    id,
    createdAt: new Date('2025-01-01'),
    notes: null,
    reviewCount,
    nextReviewAt,
    score,
    modelAnswer,
    message: {
      id: `msg-${id}`,
      content,
      questionIndex: 1,
      session: {
        id: `session-${id}`,
        category,
        difficulty,
        createdAt: new Date('2025-01-01'),
      },
    },
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────────

describe('BookmarksClient — rendering', () => {
  it('renders the header title', () => {
    render(<BookmarksClient bookmarks={[]} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders both tab buttons', () => {
    render(<BookmarksClient bookmarks={[]} />)
    expect(screen.getByText('tabDue')).toBeInTheDocument()
    expect(screen.getByText('tabAll')).toBeInTheDocument()
  })

  it('shows empty state when no bookmarks exist', () => {
    render(<BookmarksClient bookmarks={[]} />)
    // "due" tab is default and count=0 → "noDue" message
    expect(screen.getByText('noDue')).toBeInTheDocument()
  })

  it('shows noBookmarks message in "all" tab when list is empty', () => {
    render(<BookmarksClient bookmarks={[]} />)
    fireEvent.click(screen.getByText('tabAll'))
    expect(screen.getByText('noBookmarks')).toBeInTheDocument()
  })

  it('renders a bookmark card with question text', () => {
    const bookmark = makeBookmark({ content: 'Explain polymorphism in Java.' })
    render(<BookmarksClient bookmarks={[bookmark]} />)
    // Switch to "all" to see it regardless of due status
    fireEvent.click(screen.getByText('tabAll'))
    expect(screen.getByText('Explain polymorphism in Java.')).toBeInTheDocument()
  })
})

// ── Due count badge ────────────────────────────────────────────────────────────

describe('BookmarksClient — due count', () => {
  it('shows badge with due count when there are due bookmarks', () => {
    const due = makeBookmark({ id: 'bm-1', nextReviewAt: null })
    render(<BookmarksClient bookmarks={[due]} />)
    // Badge shows the count
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not show badge when no due bookmarks', () => {
    const future = makeBookmark({
      nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    render(<BookmarksClient bookmarks={[future]} />)
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})

// ── Tab switching ──────────────────────────────────────────────────────────────

describe('BookmarksClient — tab switching', () => {
  it('"due" tab shows only due bookmarks', () => {
    const due = makeBookmark({ id: 'bm-1', nextReviewAt: null, content: 'Due question.' })
    const notDue = makeBookmark({
      id: 'bm-2',
      nextReviewAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      content: 'Future question.',
    })
    render(<BookmarksClient bookmarks={[due, notDue]} />)

    // Default tab is "due"
    expect(screen.getByText('Due question.')).toBeInTheDocument()
    expect(screen.queryByText('Future question.')).not.toBeInTheDocument()
  })

  it('"all" tab shows all bookmarks', () => {
    const due = makeBookmark({ id: 'bm-1', nextReviewAt: null, content: 'Due question.' })
    const notDue = makeBookmark({
      id: 'bm-2',
      nextReviewAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      content: 'Future question.',
    })
    render(<BookmarksClient bookmarks={[due, notDue]} />)

    fireEvent.click(screen.getByText('tabAll'))

    expect(screen.getByText('Due question.')).toBeInTheDocument()
    expect(screen.getByText('Future question.')).toBeInTheDocument()
  })

  it('past-due bookmark (nextReviewAt in the past) appears in "due" tab', () => {
    const overdue = makeBookmark({
      nextReviewAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      content: 'Overdue question.',
    })
    render(<BookmarksClient bookmarks={[overdue]} />)
    expect(screen.getByText('Overdue question.')).toBeInTheDocument()
  })
})

// ── Filters ────────────────────────────────────────────────────────────────────

describe('BookmarksClient — category filter', () => {
  const bookmarks = [
    makeBookmark({ id: 'bm-1', category: 'technical', content: 'Technical question.' }),
    makeBookmark({ id: 'bm-2', category: 'coding', content: 'Coding question.' }),
    makeBookmark({ id: 'bm-3', category: 'behavioral', content: 'Behavioral question.' }),
  ]

  it('shows all bookmarks when category=all', () => {
    render(<BookmarksClient bookmarks={bookmarks} />)
    fireEvent.click(screen.getByText('tabAll'))
    expect(screen.getByText('Technical question.')).toBeInTheDocument()
    expect(screen.getByText('Coding question.')).toBeInTheDocument()
    expect(screen.getByText('Behavioral question.')).toBeInTheDocument()
  })

  it('filters by category', () => {
    render(<BookmarksClient bookmarks={bookmarks} />)
    fireEvent.click(screen.getByText('tabAll'))

    // Select "coding" from the category dropdown
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'coding' } })

    expect(screen.queryByText('Technical question.')).not.toBeInTheDocument()
    expect(screen.getByText('Coding question.')).toBeInTheDocument()
    expect(screen.queryByText('Behavioral question.')).not.toBeInTheDocument()
  })
})

describe('BookmarksClient — difficulty filter', () => {
  const bookmarks = [
    makeBookmark({ id: 'bm-1', difficulty: 'junior', content: 'Junior question.' }),
    makeBookmark({ id: 'bm-2', difficulty: 'senior', content: 'Senior question.' }),
  ]

  it('filters by difficulty', () => {
    render(<BookmarksClient bookmarks={bookmarks} />)
    fireEvent.click(screen.getByText('tabAll'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'senior' } })

    expect(screen.queryByText('Junior question.')).not.toBeInTheDocument()
    expect(screen.getByText('Senior question.')).toBeInTheDocument()
  })
})

describe('BookmarksClient — clear filters', () => {
  it('"clear filters" button resets category and difficulty', () => {
    const bookmarks = [
      makeBookmark({ id: 'bm-1', category: 'technical', difficulty: 'mid', content: 'Q1.' }),
      makeBookmark({ id: 'bm-2', category: 'coding', difficulty: 'junior', content: 'Q2.' }),
    ]
    render(<BookmarksClient bookmarks={bookmarks} />)
    fireEvent.click(screen.getByText('tabAll'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'coding' } })

    // "clear filters" button should now be visible
    const clearBtn = screen.getByText('clearFilters')
    fireEvent.click(clearBtn)

    // Both bookmarks should be visible again
    expect(screen.getByText('Q1.')).toBeInTheDocument()
    expect(screen.getByText('Q2.')).toBeInTheDocument()
    expect(screen.queryByText('clearFilters')).not.toBeInTheDocument()
  })
})

// ── noMatches empty state ──────────────────────────────────────────────────────

describe('BookmarksClient — noMatches empty state', () => {
  it('shows noMatches when filters produce no results', () => {
    const bookmark = makeBookmark({ category: 'technical' })
    render(<BookmarksClient bookmarks={[bookmark]} />)
    fireEvent.click(screen.getByText('tabAll'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'behavioral' } })

    expect(screen.getByText('noMatches')).toBeInTheDocument()
  })
})

// ── Remove bookmark ────────────────────────────────────────────────────────────

describe('BookmarksClient — remove bookmark', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('removes bookmark from the list after delete', async () => {
    const bookmark = makeBookmark({ id: 'bm-1', content: 'To be removed.' })
    render(<BookmarksClient bookmarks={[bookmark]} />)
    fireEvent.click(screen.getByText('tabAll'))

    expect(screen.getByText('To be removed.')).toBeInTheDocument()

    const removeBtn = screen.getByTitle('unsave')
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/bookmarks/bm-1', { method: 'DELETE' })
    })

    await waitFor(() => {
      expect(screen.queryByText('To be removed.')).not.toBeInTheDocument()
    })
  })
})

// ── Mark as reviewed ──────────────────────────────────────────────────────────

describe('BookmarksClient — mark as reviewed', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('calls the review endpoint', async () => {
    const bookmark = makeBookmark({ id: 'bm-1', nextReviewAt: null })
    render(<BookmarksClient bookmarks={[bookmark]} />)

    const reviewBtn = screen.getByText(`▶ review`)
    fireEvent.click(reviewBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/bookmarks/bm-1/review', { method: 'POST' })
    })
  })

  it('optimistically moves bookmark out of the "due" tab after review', async () => {
    const bookmark = makeBookmark({ id: 'bm-1', nextReviewAt: null, content: 'Review me.' })
    render(<BookmarksClient bookmarks={[bookmark]} />)

    // Visible in "due" tab
    expect(screen.getByText('Review me.')).toBeInTheDocument()

    fireEvent.click(screen.getByText(`▶ review`))

    await waitFor(() => {
      // Should be removed from "due" tab (optimistic update sets future date)
      expect(screen.queryByText('Review me.')).not.toBeInTheDocument()
    })
  })
})

// ── Show/hide model answer ─────────────────────────────────────────────────────

describe('BookmarksClient — show/hide model answer', () => {
  it('toggles model answer visibility on chevron click', () => {
    const bookmark = makeBookmark({
      modelAnswer: 'HashMap uses hashing, TreeMap uses Red-Black tree.',
    })
    render(<BookmarksClient bookmarks={[bookmark]} />)
    fireEvent.click(screen.getByText('tabAll'))

    // Model answer not visible initially
    expect(
      screen.queryByText('HashMap uses hashing, TreeMap uses Red-Black tree.')
    ).not.toBeInTheDocument()

    // Click expand button
    const expandBtn = screen.getByTitle('showAnswer')
    fireEvent.click(expandBtn)

    expect(
      screen.getByText('HashMap uses hashing, TreeMap uses Red-Black tree.')
    ).toBeInTheDocument()

    // Click again to collapse
    fireEvent.click(screen.getByTitle('hideAnswer'))
    expect(
      screen.queryByText('HashMap uses hashing, TreeMap uses Red-Black tree.')
    ).not.toBeInTheDocument()
  })

  it('shows noModelAnswer placeholder when modelAnswer is null', () => {
    const bookmark = makeBookmark({ modelAnswer: null })
    render(<BookmarksClient bookmarks={[bookmark]} />)
    fireEvent.click(screen.getByText('tabAll'))

    fireEvent.click(screen.getByTitle('showAnswer'))
    expect(screen.getByText('noModelAnswer')).toBeInTheDocument()
  })
})
