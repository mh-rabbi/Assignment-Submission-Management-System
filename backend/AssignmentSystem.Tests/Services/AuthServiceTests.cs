using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Common.Exceptions;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Auth;
using AssignmentSystem.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AssignmentSystem.Tests.Services;

public class AuthServiceTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration GetConfiguration()
    {
        EnvironmentConfiguration.LoadDotEnv();

        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                {"JWT_ISSUER", "AssignmentSystem"},
                {"JWT_AUDIENCE", "AssignmentSystemClients"},
                {"JWT_EXPIRY_MINUTES", "60"}
            })
            .AddEnvironmentVariables()
            .Build();
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ShouldReturnAuthResponseWithToken()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var config = GetConfiguration();
        var service = new AuthService(db, config);

        var password = "SecretPassword123";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Alice Admin",
            Email = "admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Role.Admin,
            IsActive = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var dto = new LoginDto { Email = "admin@test.com", Password = password };

        // Act
        var result = await service.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.Email.Should().Be("admin@test.com");
        result.Role.Should().Be("Admin");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var config = GetConfiguration();
        var service = new AuthService(db, config);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Bob Teacher",
            Email = "bob@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            Role = Role.Teacher,
            IsActive = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var dto = new LoginDto { Email = "bob@test.com", Password = "WrongPassword" };

        // Act & Assert
        var act = () => service.LoginAsync(dto);
        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task RegisterAsync_StudentWithoutClassId_ShouldThrowArgumentException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var config = GetConfiguration();
        var service = new AuthService(db, config);

        var dto = new RegisterDto
        {
            Name = "New Student",
            Email = "student@test.com",
            Password = "Password123",
            Role = "Student",
            ClassId = null // Missing ClassId for Student
        };

        // Act & Assert
        var act = () => service.RegisterAsync(dto);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*ClassId is required for Students*");
    }
}
