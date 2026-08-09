namespace AssignmentSystem.Api.Data.Entities;

/// <summary>Single source of truth for Teacher ↔ Subject ↔ Class teaching assignments.</summary>
public class TeacherSubjectClass
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid ClassId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation
    public User Teacher { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
    public ClassEntity Class { get; set; } = null!;
}
