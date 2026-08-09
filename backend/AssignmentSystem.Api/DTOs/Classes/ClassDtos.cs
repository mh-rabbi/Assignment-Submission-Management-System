namespace AssignmentSystem.Api.DTOs.Classes;

public class CreateClassDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateClassDto
{
    public string? Name { get; set; }
}

public class ClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
