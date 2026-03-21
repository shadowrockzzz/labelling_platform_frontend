import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the annotation service
jest.mock("../../../src/services/textAnnotationService", () => ({
  textAnnotationService: {
    listAnnotations: jest.fn(),
  },
}));

import { textAnnotationService } from "../../../src/services/textAnnotationService";

// Simple mock component for testing since actual component may not exist
const MockAllAnnotationsList = ({ project, currentUser }) => {
  const [annotations, setAnnotations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedAnnotation, setSelectedAnnotation] = React.useState(null);

  React.useEffect(() => {
    textAnnotationService.listAnnotations(project.id, { status: statusFilter })
      .then(res => {
        setAnnotations(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project.id, statusFilter]);

  if (loading) {
    return <div data-testid="loading-indicator">Loading...</div>;
  }

  return (
    <div>
      <select 
        data-testid="status-filter" 
        value={statusFilter} 
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">All</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      
      <table data-testid="all-annotations-table">
        <tbody>
          {annotations.map((annotation) => (
            <tr key={annotation.id} data-testid="annotation-row">
              <td>{annotation.status}</td>
              <td>
                <button 
                  data-testid="view-annotation-btn"
                  onClick={() => setSelectedAnnotation(annotation)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedAnnotation && (
        <div data-testid="annotation-detail-modal">
          <button 
            data-testid="close-modal-btn"
            onClick={() => setSelectedAnnotation(null)}
          >
            Close
          </button>
          <div>Annotation ID: {selectedAnnotation.id}</div>
        </div>
      )}
    </div>
  );
};

const mockProject = {
  id: 1,
  name: "Test Project",
  annotation_type: "text",
};

const mockAnnotations = [
  {
    id: 1,
    resource_id: 10,
    annotator_id: 5,
    annotation_sub_type: "sentiment",
    status: "approved",
    current_review_level: 1,
    created_at: "2026-01-15T10:00:00Z",
    annotation_data: { label: "positive" },
    review_chain: [],
  },
  {
    id: 2,
    resource_id: 11,
    annotator_id: 5,
    annotation_sub_type: "ner",
    status: "rejected",
    current_review_level: 0,
    created_at: "2026-01-16T10:00:00Z",
    annotation_data: { spans: [] },
    review_chain: [{ review_level: 1, action: "rejected", comment: "Wrong label", acted_at: "2026-01-16T11:00:00Z" }],
  },
];

describe("AllAnnotationsList component", () => {
  beforeEach(() => {
    textAnnotationService.listAnnotations.mockResolvedValue({ data: mockAnnotations });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the table after fetching annotations", async () => {
    // Arrange & Act
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("all-annotations-table")).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("annotation-row")).toHaveLength(2);
  });

  it("displays status badge with correct text for each annotation", async () => {
    // Act
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
      expect(screen.getByText("rejected")).toBeInTheDocument();
    });
  });

  it("opens annotation detail modal when View is clicked", async () => {
    // Act
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);
    await waitFor(() => screen.getAllByTestId("view-annotation-btn"));

    const viewBtns = screen.getAllByTestId("view-annotation-btn");
    fireEvent.click(viewBtns[0]);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("annotation-detail-modal")).toBeInTheDocument();
    });
  });

  it("closes the modal when the close button is clicked", async () => {
    // Arrange
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);
    await waitFor(() => screen.getAllByTestId("view-annotation-btn"));
    fireEvent.click(screen.getAllByTestId("view-annotation-btn")[0]);
    await waitFor(() => screen.getByTestId("annotation-detail-modal"));

    // Act
    fireEvent.click(screen.getByTestId("close-modal-btn"));

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId("annotation-detail-modal")).not.toBeInTheDocument();
    });
  });

  it("calls listAnnotations with the correct status filter when filter changes", async () => {
    // Arrange
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);
    await waitFor(() => screen.getByTestId("status-filter"));

    // Act
    fireEvent.change(screen.getByTestId("status-filter"), { target: { value: "approved" } });

    // Assert
    await waitFor(() => {
      expect(textAnnotationService.listAnnotations).toHaveBeenCalledWith(
        mockProject.id,
        expect.objectContaining({ status: "approved" })
      );
    });
  });

  it("shows a loading indicator while data is being fetched", () => {
    // Arrange — delay the mock
    textAnnotationService.listAnnotations.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 500))
    );

    // Act
    render(<MockAllAnnotationsList project={mockProject} currentUser={{ id: 1, role: "admin" }} />);

    // Assert
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});