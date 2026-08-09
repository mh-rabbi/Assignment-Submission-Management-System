using AssignmentSystem.Api.Common.Enums;

namespace AssignmentSystem.Api.Data.Entities;

/// <summary>An assignment created by a Teacher for a specific Subject+Class combination.</summary>
public class Assignment
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public Guid ClassId { get; set; }
    public Guid TeacherId { get; set; }
    public DateTimeOffset Deadline { get; set; }
    public int MaxMarks { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    public bool AllowLateSubmission { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public Subject Subject { get; set; } = null!;
    public ClassEntity Class { get; set; } = null!;
    public User Teacher { get; set; } = null!;
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
