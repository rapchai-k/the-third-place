import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiltedCard, SpotlightCard, SilkBackground, Masonry, CommunityCarousel } from '@/components/reactbits';

describe('ReactBits Components', () => {
  describe('TiltedCard', () => {
    it('renders community data correctly', () => {
      const mockCommunity = {
        id: '1',
        name: 'Test Community',
        description: 'A test community',
        members: 42,
        city: 'Test City'
      };

      render(<TiltedCard community={mockCommunity} />);
      
      expect(screen.getByText('Test Community')).toBeInTheDocument();
      expect(screen.getByText('A test community')).toBeInTheDocument();
      expect(screen.getByText('42 members')).toBeInTheDocument();
      expect(screen.getByText('Test City')).toBeInTheDocument();
    });

    it('renders children when no community prop is provided', () => {
      render(
        <TiltedCard>
          <div>Custom content</div>
        </TiltedCard>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('SpotlightCard', () => {
    it('renders title and description correctly', () => {
      render(
        <SpotlightCard 
          title="Test Title" 
          description="Test Description"
          icon={<div data-testid="test-icon">Icon</div>}
        />
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('SilkBackground', () => {
    it('renders children correctly', () => {
      render(
        <SilkBackground>
          <div>Background content</div>
        </SilkBackground>
      );
      
      expect(screen.getByText('Background content')).toBeInTheDocument();
    });
  });

  describe('Masonry', () => {
    it('renders masonry items correctly', () => {
      const mockItems = [
        { id: '1', src: 'test1.jpg', alt: 'Test Image 1' },
        { id: '2', src: 'test2.jpg', alt: 'Test Image 2' }
      ];

      render(<Masonry items={mockItems} />);

      expect(screen.getByAltText('Test Image 1')).toBeInTheDocument();
      expect(screen.getByAltText('Test Image 2')).toBeInTheDocument();
    });
  });

  describe('CommunityCarousel', () => {
    it('renders community carousel correctly', () => {
      const mockCommunities = [
        { id: '1', name: 'Test Community 1', description: 'Description 1', members: 10, city: 'City 1' },
        { id: '2', name: 'Test Community 2', description: 'Description 2', members: 20, city: 'City 2' }
      ];

      render(<CommunityCarousel communities={mockCommunities} />);

      expect(screen.getByText('Test Community 1')).toBeInTheDocument();
      expect(screen.getByText('Test Community 2')).toBeInTheDocument();
    });

    it('renders navigation buttons on desktop', () => {
      const mockCommunities = [
        { id: '1', name: 'Test Community', description: 'Description', members: 10, city: 'City' }
      ];

      render(<CommunityCarousel communities={mockCommunities} />);

      // Navigation buttons should be present (though hidden on mobile via CSS)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
