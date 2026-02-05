import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('App Component', () => {
    it('renders login page by default when not authenticated', () => {
        // We can't easily test the full App with Router inside App because App contains Router.
        // But App contains Login route.
        // Wait, App has Router -> AuthProvider -> Routes.
        // If we render <App />, it should work.

        render(<App />);
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
});
