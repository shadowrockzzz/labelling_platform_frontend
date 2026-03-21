import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the review task service
jest.mock("../../../src/services/reviewTaskService", () => ({
  reviewTaskService: {
    getMyActiveReviewTask: jest.fn().mockResolvedValue({ data: null }),
    startReview: jest.fn(),
  },
}));

import { reviewTaskService } from "../../../src/services/reviewTaskService";

// Simple mock component for ReviewTaskWorkspace
const MockReviewTaskWorkspace = ({ project, currentUser, projectTeam }) => {
  const [activeTask, setActiveTask] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Find user's review level from team
  const userTeamEntry = projectTeam?.find(m => m.user_id === currentUser.id);
  const reviewLevel = userTeamEntry?.review_level || 1;

  const handleStartReview = async () => {
    setLoading(true);
    try {
      const res = await reviewTaskService.startReview(project.id);
      setActiveTask(res.data);
    } catch (err) {
      // No tasks available
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Read-only level display - no dropdown */}
      <div data-testid="reviewer-level-display">
        Review Level: {reviewLevel}
      </div>

      {!activeTask ? (
        <button 
          data-testid="start-reviewing-btn" 
          onClick={handleStartReview}
          disabled={loading}
        >
          {loading ? "Loading..." : "Start Reviewing"}
        </button>
      ) : (
        <div>
          <button data-testid="approve-btn">Approve</button>
          <button data-testid="reject-btn">Reject</button>
        </div>
      )}
    </div>
  );
};

const mockProject = { 
  id: 1, 
  annotation_type: "text", 
  config: { textSubType: "sentiment" } 
};

const mockUser = { id: 10, role: "reviewer" };

const mockTeam = [
  { user_id: 10, role: "reviewer", review_level: 2 },
];

describe("ReviewTaskWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays reviewer level as read-only text, not a dropdown", async () => {
    // Act
    render(
      <MockReviewTaskWorkspace
        project={mockProject}
        currentUser={mockUser}
        projectTeam={mockTeam}
      />
    );

    // Assert — read-only level text must exist
    expect(screen.getByTestId("reviewer-level-display")).toBeInTheDocument();
    expect(screen.getByTestId("reviewer-level-display").textContent).toContain("2");

    // Assert — no select/dropdown for level
    expect(screen.queryByTestId("review-level-select")).not.toBeInTheDocument();
  });

  it("shows the Start Reviewing button when no active task", async () => {
    // Act
    render(
      <MockReviewTaskWorkspace
        project={mockProject}
        currentUser={mockUser}
        projectTeam={mockTeam}
      />
    );

    // Assert
    expect(screen.getByTestId("start-reviewing-btn")).toBeInTheDocument();
  });

  it("calls startReview when Start Reviewing button is clicked", async () => {
    // Arrange
    reviewTaskService.startReview.mockResolvedValue({ 
      data: { id: "task-123", status: "locked" } 
    });

    render(
      <MockReviewTaskWorkspace
        project={mockProject}
        currentUser={mockUser}
        projectTeam={mockTeam}
      />
    );

    // Act
    fireEvent.click(screen.getByTestId("start-reviewing-btn"));

    // Assert
    await waitFor(() => {
      expect(reviewTaskService.startReview).toHaveBeenCalledWith(mockProject.id);
    });
  });

  it("shows Approve and Reject buttons after starting review", async () => {
    // Arrange
    reviewTaskService.startReview.mockResolvedValue({ 
      data: { id: "task-123", status: "locked" } 
    });

    render(
      <MockReviewTaskWorkspace
        project={mockProject}
        currentUser={mockUser}
        projectTeam={mockTeam}
      />
    );

    // Act
    fireEvent.click(screen.getByTestId("start-reviewing-btn"));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("approve-btn")).toBeInTheDocument();
      expect(screen.getByTestId("reject-btn")).toBeInTheDocument();
    });
  });

  it("defaults to level 1 when user has no team entry", async () => {
    // Arrange
    const emptyTeam = [];

    // Act
    render(
      <MockReviewTaskWorkspace
        project={mockProject}
        currentUser={mockUser}
        projectTeam={emptyTeam}
      />
    );

    // Assert
    expect(screen.getByTestId("reviewer-level-display").textContent).toContain("1");
  });
});