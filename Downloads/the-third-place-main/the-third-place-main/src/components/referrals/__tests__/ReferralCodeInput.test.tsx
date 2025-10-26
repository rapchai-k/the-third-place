import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferralCodeInput } from '../ReferralCodeInput';

describe('ReferralCodeInput', () => {
  const mockOnApplyCode = vi.fn();

  beforeEach(() => {
    mockOnApplyCode.mockClear();
  });

  it('renders correctly with default props', () => {
    render(<ReferralCodeInput />);
    
    expect(screen.getByText('Have a Referral Code?')).toBeInTheDocument();
    expect(screen.getByText('Enter a referral code (like "8D604377") to get special community benefits')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)')).toBeInTheDocument();
  });

  it('accepts valid alphanumeric referral codes', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const submitButton = screen.getByText('Apply');
    
    fireEvent.change(input, { target: { value: '8D604377' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnApplyCode).toHaveBeenCalledWith('8D604377');
    });
  });

  it('converts lowercase input to uppercase', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    
    fireEvent.change(input, { target: { value: 'abc123' } });
    
    expect(input).toHaveValue('ABC123');
  });

  it('shows error for invalid characters', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    
    fireEvent.change(input, { target: { value: 'ABC-123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Referral code must contain only letters and numbers')).toBeInTheDocument();
    });
  });

  it('extracts referral code from valid URL', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const submitButton = screen.getByText('Apply');
    
    fireEvent.change(input, { target: { value: 'https://preview--my-third-place.lovable.app/auth?ref=8D604377' } });
    
    // Should extract and display the code
    expect(input).toHaveValue('8D604377');
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnApplyCode).toHaveBeenCalledWith('8D604377');
    });
  });

  it('shows error for URL without ref parameter', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    
    fireEvent.change(input, { target: { value: 'https://example.com/auth' } });
    
    await waitFor(() => {
      expect(screen.getByText('No referral code found in URL')).toBeInTheDocument();
    });
  });

  it('shows error for invalid URL format', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    
    fireEvent.change(input, { target: { value: 'https://invalid-url' } });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });
  });

  it('disables submit button when there are input errors', async () => {
    render(<ReferralCodeInput onApplyCode={mockOnApplyCode} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const submitButton = screen.getByText('Apply');
    
    fireEvent.change(input, { target: { value: 'ABC-123' } });
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('shows success state when success prop is true', () => {
    render(<ReferralCodeInput success={true} />);
    
    expect(screen.getByText('Referral code applied successfully! You and your referrer will both get special benefits.')).toBeInTheDocument();
  });

  it('shows error alert when error prop is provided', () => {
    render(<ReferralCodeInput error="Invalid referral code" />);
    
    expect(screen.getByText('Invalid referral code')).toBeInTheDocument();
  });

  it('disables input and button when loading', () => {
    render(<ReferralCodeInput loading={true} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const submitButton = screen.getByText('Applying...');
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
