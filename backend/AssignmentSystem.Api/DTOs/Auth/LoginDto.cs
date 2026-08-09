namespace AssignmentSystem.Api.DTOs.Auth;

/// <summary>Request body for user login.</summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
