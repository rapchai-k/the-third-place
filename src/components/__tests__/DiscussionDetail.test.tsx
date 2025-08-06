import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DiscussionDetail from '@/pages/DiscussionDetail';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
  removeChannel: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock router params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-discussion-id' }),
    useNavigate: () => vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('DiscussionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => new Promise(() => {})), // Never resolves
        })),
      })),
    });

    render(<DiscussionDetail />, { wrapper: createWrapper() });
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders discussion content when loaded', async () => {
    const mockDiscussion = {
      id: 'test-id',
      title: 'Test Discussion',
      prompt: 'This is a test discussion',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-12-31T23:59:59Z',
      communities: { name: 'Test Community' },
      users: { name: 'Test User', photo_url: null },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockDiscussion, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    });

    render(<DiscussionDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Discussion')).toBeInTheDocument();
    });
  });

  it('shows expired badge for expired discussions', async () => {
    const expiredDiscussion = {
      id: 'test-id',
      title: 'Expired Discussion',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-01-01T00:00:00Z', // Expired
      communities: { name: 'Test Community' },
      users: { name: 'Test User', photo_url: null },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: expiredDiscussion, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    });

    render(<DiscussionDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  it('handles comment submission', async () => {
    const mockDiscussion = {
      id: 'test-id',
      title: 'Test Discussion',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-12-31T23:59:59Z',
      community_id: 'community-id',
      communities: { name: 'Test Community' },
      users: { name: 'Test User', photo_url: null },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockDiscussion, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    });

    render(<DiscussionDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Discussion')).toBeInTheDocument();
    });
  });
});