import { render, screen } from '@testing-library/react';
import PropertyCard from '@/components/property/PropertyCard';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  };
});

const mockProperty = {
  _id: '64abc123',
  surveyNumber: '45/2A',
  city: 'Mumbai',
  state: 'Maharashtra',
  area: 2400,
  status: 'active',
  currentOwner: { name: 'Rajesh Kumar', email: 'rajesh@example.com' },
  createdAt: '2023-10-01T00:00:00.000Z',
};

describe('PropertyCard', () => {
  it('renders property survey number', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('45/2A')).toBeInTheDocument();
  });

  it('renders city and state', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders owner name', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
  });

  it('renders formatted area', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('2,400 sq ft')).toBeInTheDocument();
  });

  it('links to the property detail page', () => {
    render(<PropertyCard property={mockProperty} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/property/64abc123');
  });
});
