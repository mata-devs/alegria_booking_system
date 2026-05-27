// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import ActivityCardUI from '../ActivityCardUI'

expect.extend(matchers)

const base = {
  image: '/img.jpg',
  title: 'Tops of Cebu Lookout',
  price: 1000,
}

describe('ActivityCardUI', () => {
  it('renders title and price', () => {
    render(<ActivityCardUI {...base} />)
    expect(screen.getByRole('heading', { name: /tops of cebu lookout/i })).toBeInTheDocument()
    expect(screen.getAllByText(/₱1,000/).length).toBe(2)
  })

  it('renders tags twice — mobile chips and desktop overlay', () => {
    render(<ActivityCardUI {...base} tags={['Adventure', 'Sightseeing']} />)
    expect(screen.getAllByText('Adventure').length).toBe(2)
    expect(screen.getAllByText('Sightseeing').length).toBe(2)
  })

  it('renders a single tag via legacy tag prop', () => {
    render(<ActivityCardUI {...base} tag="Hiking" />)
    expect(screen.getAllByText('Hiking').length).toBe(2)
  })

  it('renders rating and review count twice — mobile inline and desktop bar', () => {
    render(<ActivityCardUI {...base} rating={4.4} reviewCount={265} />)
    expect(screen.getAllByText('4.4').length).toBe(2)
    expect(screen.getAllByText('(265)').length).toBe(2)
  })

  it('renders location', () => {
    render(<ActivityCardUI {...base} location="Cebu City" />)
    expect(screen.getByText('Cebu City')).toBeInTheDocument()
  })

  it('renders duration', () => {
    render(<ActivityCardUI {...base} duration="1 to 3 hours" />)
    expect(screen.getByText('1 to 3 hours')).toBeInTheDocument()
  })

  it('wraps card in Link when href provided', () => {
    render(<ActivityCardUI {...base} href="/activities/123" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/activities/123')
  })

  it('card root has responsive flex direction classes', () => {
    const { container } = render(<ActivityCardUI {...base} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toMatch(/flex-row/)
    expect(card.className).toMatch(/sm:flex-col/)
  })

  it('mobile tag chips container has sm:hidden class', () => {
    const { container } = render(<ActivityCardUI {...base} tags={['Adventure']} />)
    const mobileChips = container.querySelector('[class*="sm:hidden"]')
    expect(mobileChips).not.toBeNull()
  })

  it('desktop tag overlay has hidden sm:flex class', () => {
    const { container } = render(<ActivityCardUI {...base} tags={['Adventure']} />)
    const desktopOverlay = container.querySelector('[class*="hidden"][class*="sm:flex"]')
    expect(desktopOverlay).not.toBeNull()
  })

  it('renders topRightAction', () => {
    render(<ActivityCardUI {...base} topRightAction={<button data-testid="heart">heart</button>} />)
    expect(screen.getByTestId('heart')).toBeInTheDocument()
  })
})
