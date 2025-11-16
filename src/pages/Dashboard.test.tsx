import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from './Dashboard.jsx';

describe.skip('Dashboard', () => {
    it('renders clothing services heading', () => {
        render(<Dashboard />);
        expect(screen.getByText('Clothing Services')).toBeInTheDocument();
    });

    it('renders service description', () => {
        render(<Dashboard />);
        expect(
            screen.getByText('Browse our laundry and dry cleaning services')
        ).toBeInTheDocument();
    });

    it('renders filter buttons', () => {
        render(<Dashboard />);
        expect(screen.getByRole('button', { name: /All Items/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Premium/i })).toBeInTheDocument();
    });

    it('renders clothing items', () => {
        render(<Dashboard />);
        expect(screen.getByText('Designer Silk Saree')).toBeInTheDocument();
        expect(screen.getByText('Cotton Dress Shirts')).toBeInTheDocument();
    });
});