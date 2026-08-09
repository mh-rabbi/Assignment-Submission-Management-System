namespace AssignmentSystem.Api.Data.Entities;

/// <summary>Snapshot of a Submission before each edit. Deleted when parent Submission is deleted.</summary>
public class SubmissionHistory
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public DateTimeOffset EditedAt { get; set; }

    // Navigation
    public Submission Submission { get; set; } = null!;
}
