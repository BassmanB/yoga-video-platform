import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Example React component test demonstrating:
 * - Component rendering
 * - User interactions
 * - Testing Library best practices
 */

// Simple Button component for testing
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

describe("Button", () => {
  it("should render button with text", () => {
    // Arrange & Act
    render(
      <Button
        onClick={() => {
          // no-op
        }}
      >
        Click me
      </Button>
    );

    // Assert
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByRole("button", { name: /click me/i }));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple clicks", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(3);
  });
});
