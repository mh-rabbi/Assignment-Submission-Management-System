using AssignmentSystem.Api.Common.Enums;

namespace AssignmentSystem.Api.Data.Entities;

/// <summary>A student's current submission for an assignment. One row per (Assignment, Student).</summary>
public class Submission
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }
    public string Content { get; set; } = string.Empty;
    /// <summary>Nullable; local disk path to uploaded file.</summary>
    public string? FilePath { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    /// <summary>True if SubmittedAt > Assignment.Deadline. Computed server-side.</summary>
    public bool IsLate { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public Assignment Assignment { get; set; } = null!;
    public User Student { get; set; } = null!;
    public ICollection<SubmissionHistory> History { get; set; } = new List<SubmissionHistory>();
}
