namespace AssignmentSystem.Api.DTOs.Subjects;

public class CreateSubjectDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateSubjectDto
{
    public string? Name { get; set; }
}

public class SubjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
