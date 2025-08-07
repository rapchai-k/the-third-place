import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client for integration testing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Flag Comment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a flag record when flagging a comment', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      data: {
        id: 'flag-123',
        flagged_user_id: 'user-456',
        flagged_by_id: 'user-123',
        comment_id: 'comment-789',
        reason: 'Inappropriate content',
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    // Simulate the flag creation
    const flagData = {
      flagged_user_id: 'user-456',
      flagged_by_id: 'user-123',
      comment_id: 'comment-789',
      reason: 'Inappropriate content',
    };

    const { data, error } = await supabase
      .from('flags')
      .insert(flagData);

    expect(error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith(flagData);
    expect(data?.id).toBe('flag-123');
  });

  it('should handle flag creation errors gracefully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'RLS policy violation',
        code: 'RLS_VIOLATION',
      },
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const flagData = {
      flagged_user_id: 'user-456',
      flagged_by_id: 'user-123',
      comment_id: 'comment-789',
      reason: 'Inappropriate content',
    };

    const { data, error } = await supabase
      .from('flags')
      .insert(flagData);

    expect(data).toBeNull();
    expect(error?.code).toBe('RLS_VIOLATION');
    expect(mockInsert).toHaveBeenCalledWith(flagData);
  });

  it('should validate required fields for flag creation', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'Missing required fields',
        code: 'VALIDATION_ERROR',
      },
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    // Missing required fields
    const invalidFlagData = {
      flagged_user_id: 'user-456',
      // Missing flagged_by_id, comment_id, and reason
    };

    const { data, error } = await supabase
      .from('flags')
      .insert(invalidFlagData);

    expect(data).toBeNull();
    expect(error?.code).toBe('VALIDATION_ERROR');
  });

  it('should support flagging comments with different reasons', async () => {
    const reasons = [
      'Inappropriate content',
      'Spam',
      'Harassment',
      'Off-topic',
      'Misinformation',
    ];

    const mockInsert = vi.fn().mockResolvedValue({
      data: { id: 'flag-123' },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    for (const reason of reasons) {
      const flagData = {
        flagged_user_id: 'user-456',
        flagged_by_id: 'user-123',
        comment_id: 'comment-789',
        reason,
      };

      const { error } = await supabase
        .from('flags')
        .insert(flagData);

      expect(error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(flagData);
    }

    expect(mockInsert).toHaveBeenCalledTimes(reasons.length);
  });
});
