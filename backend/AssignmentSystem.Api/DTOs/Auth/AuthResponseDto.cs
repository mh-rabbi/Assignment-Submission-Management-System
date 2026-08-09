namespace AssignmentSystem.Api.DTOs.Auth;

/// <summary>Returned after successful login or registration.</summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid? ClassId { get; set; }
    public DateTime ExpiresAt { get; set; }
}
