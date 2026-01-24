import { describe, it, expect } from 'vitest';

/**
 * Example unit test demonstrating Vitest setup
 * Following best practices:
 * - Descriptive test names
 * - Arrange-Act-Assert pattern
 * - Explicit assertions
 */

// Simple utility function to test
function add(a: number, b: number): number {
  return a + b;
}

describe('add', () => {
  it('should add two positive numbers', () => {
    // Arrange
    const a = 2;
    const b = 3;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(5);
  });

  it('should add negative numbers', () => {
    expect(add(-1, -1)).toBe(-2);
  });

  it('should handle zero', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
  });
});
