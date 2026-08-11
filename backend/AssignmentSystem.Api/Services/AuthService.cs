using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Common.Exceptions;
using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Auth;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new InvalidCredentialsException("Invalid email or password.");

        var (token, expiresAt) = JwtHelper.GenerateToken(user, _config);
        return MapToResponse(user, token, expiresAt);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new InvalidOperationException("Email already in use.");

        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            throw new ArgumentException($"Invalid role: {dto.Role}");

        // Business rule: only Students may have ClassId
        if (role != Role.Student && dto.ClassId.HasValue)
            throw new ArgumentException("ClassId can only be set for Students.");

        if (role == Role.Student)
        {
            if (!dto.ClassId.HasValue)
                throw new ArgumentException("ClassId is required for Students.");

            var classExists = await _db.Classes.AnyAsync(c => c.Id == dto.ClassId.Value && c.IsActive);
            if (!classExists)
                throw new ArgumentException($"Class with ID '{dto.ClassId.Value}' was not found or is inactive.");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            ClassId = dto.ClassId,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = JwtHelper.GenerateToken(user, _config);
        return MapToResponse(user, token, expiresAt);
    }

    private static AuthResponseDto MapToResponse(User user, string token, DateTime expiresAt)
    {
        return new AuthResponseDto
        {
            Token = token,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role.ToString(),
            UserId = user.Id,
            ClassId = user.ClassId,
            ExpiresAt = expiresAt
        };
    }
}
