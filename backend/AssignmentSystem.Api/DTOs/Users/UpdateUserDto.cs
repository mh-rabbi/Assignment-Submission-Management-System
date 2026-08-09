namespace AssignmentSystem.Api.DTOs.Users;

public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public Guid? ClassId { get; set; }
}
