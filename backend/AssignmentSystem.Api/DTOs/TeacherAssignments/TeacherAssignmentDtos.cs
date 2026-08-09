namespace AssignmentSystem.Api.DTOs.TeacherAssignments;

public class CreateTeacherAssignmentDto
{
    public Guid TeacherId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid ClassId { get; set; }
}

public class TeacherAssignmentDto
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
