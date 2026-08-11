namespace AssignmentSystem.Api.DTOs.Assignments;

public class CreateAssignmentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public Guid ClassId { get; set; }

    /// <summary>Target teacher ID for assignment creation. Required when caller is Admin; ignored when caller is Teacher.</summary>
    public Guid? TeacherId { get; set; }

    public DateTimeOffset Deadline { get; set; }
    public int MaxMarks { get; set; }
    public bool AllowLateSubmission { get; set; } = false;
}

public class UpdateAssignmentDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset? Deadline { get; set; }
    public int? MaxMarks { get; set; }
    public bool? AllowLateSubmission { get; set; }
}

public class PatchAssignmentStatusDto
{
    /// <summary>New status: Draft, Published, or Closed.</summary>
    public string Status { get; set; } = string.Empty;
}

public class AssignmentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateTimeOffset Deadline { get; set; }
    public int MaxMarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool AllowLateSubmission { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
