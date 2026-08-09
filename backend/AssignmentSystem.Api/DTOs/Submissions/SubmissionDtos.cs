namespace AssignmentSystem.Api.DTOs.Submissions;

public class SubmitAssignmentDto
{
    public Guid AssignmentId { get; set; }
    public string Content { get; set; } = string.Empty;
    // File is handled as IFormFile in the controller (multipart/form-data)
}

public class GradeSubmissionDto
{
    public int Marks { get; set; }
    public string? Feedback { get; set; }
}

public class PatchSubmissionStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public bool IsLate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class SubmissionHistoryDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public DateTimeOffset EditedAt { get; set; }
}
