namespace AssignmentSystem.Api.DTOs.Auth;

/// <summary>Request body for user self-registration (for testing; Admin-managed creation is the primary flow).</summary>
public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    /// <summary>Required when Role = Student.</summary>
    public Guid? ClassId { get; set; }
}
