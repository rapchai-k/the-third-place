import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferralCodeModal } from '../ReferralCodeModal';

describe('ReferralCodeModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onApplyCode: vi.fn(),
    onSkip: vi.fn(),
    referralCodeFromUrl: null,
    loading: false,
    error: '',
    success: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    expect(screen.getByText('Welcome! Do you have a referral code?')).toBeInTheDocument();
    expect(screen.getByText('If someone invited you to join, enter their referral code to get special community benefits.')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<ReferralCodeModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Welcome! Do you have a referral code?')).not.toBeInTheDocument();
  });

  it('pre-fills referral code from URL', () => {
    render(<ReferralCodeModal {...defaultProps} referralCodeFromUrl="TEST123" />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    expect(input).toHaveValue('TEST123');
  });

  it('shows referral code from URL card when provided', () => {
    render(<ReferralCodeModal {...defaultProps} referralCodeFromUrl="TEST123" />);
    
    expect(screen.getByText("You've been invited!")).toBeInTheDocument();
    expect(screen.getByText('TEST123')).toBeInTheDocument();
  });

  it('calls onApplyCode when form is submitted with valid code', async () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const applyButton = screen.getByText('Apply Code');
    
    fireEvent.change(input, { target: { value: 'VALID123' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(defaultProps.onApplyCode).toHaveBeenCalledWith('VALID123');
    });
  });

  it('calls onSkip when skip button is clicked', () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    const skipButton = screen.getByText('Skip for now');
    fireEvent.click(skipButton);
    
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<ReferralCodeModal {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Applying...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)')).toBeDisabled();
  });

  it('shows error state', () => {
    render(<ReferralCodeModal {...defaultProps} error="Invalid referral code" />);
    
    expect(screen.getByText('Invalid referral code')).toBeInTheDocument();
  });

  it('shows success state', () => {
    render(<ReferralCodeModal {...defaultProps} success={true} />);
    
    expect(screen.getByText('Referral code applied successfully! You\'ll receive special benefits.')).toBeInTheDocument();
    expect(screen.getByText('Applied!')).toBeInTheDocument();
  });

  it('validates referral code input (alphanumeric only, max 8 chars)', async () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    
    // Test special characters are removed
    fireEvent.change(input, { target: { value: 'TEST@123!' } });
    expect(input).toHaveValue('TEST123');
    
    // Test max length
    fireEvent.change(input, { target: { value: 'VERYLONGCODE' } });
    expect(input).toHaveValue('VERYLONG');
    
    // Test lowercase is converted to uppercase
    fireEvent.change(input, { target: { value: 'test123' } });
    expect(input).toHaveValue('TEST123');
  });

  it('disables apply button when no code is entered', () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    const applyButton = screen.getByText('Apply Code');
    expect(applyButton).toBeDisabled();
  });

  it('enables apply button when valid code is entered', () => {
    render(<ReferralCodeModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter referral code (e.g., 8D604377)');
    const applyButton = screen.getByText('Apply Code');
    
    fireEvent.change(input, { target: { value: 'VALID123' } });
    expect(applyButton).not.toBeDisabled();
  });
});
