using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class AuthTests
{
    private readonly ApiIntegrationFixture _fx;

    public AuthTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnJwtAndClaims()
    {
        var result = await _fx.LoginAsync("admin@school.test", "Admin@123");

        result.Token.Should().NotBeNullOrWhiteSpace();
        result.Email.Should().Be("admin@school.test");
        result.Role.Should().Be("Admin");
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturn401()
    {
        using var response = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(
            HttpMethod.Post,
            "api/auth/login",
            new { email = "admin@school.test", password = "wrong-password" }));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_StudentLifecycleDuplicateAndValidation_ShouldBehaveCorrectly()
    {
        var email = $"{_fx.Prefix}-registered@example.test";
        using var created = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(
            HttpMethod.Post,
            "api/auth/register",
            new { name = $"{_fx.Prefix} Registered Student", email, password = "Password123!", role = "Student", classId = _fx.Seed.Grade10ClassId }));

        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await _fx.ReadJsonNodeAsync(created);
        body["token"]!.GetValue<string>().Should().NotBeNullOrWhiteSpace();

        using var duplicate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(
            HttpMethod.Post,
            "api/auth/register",
            new { name = $"{_fx.Prefix} Registered Student", email, password = "Password123!", role = "Student", classId = _fx.Seed.Grade10ClassId }));
        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var missingClass = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(
            HttpMethod.Post,
            "api/auth/register",
            new { name = $"{_fx.Prefix} No Class", email = $"{_fx.Prefix}-no-class@example.test", password = "Password123!", role = "Student" }));
        missingClass.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_StudentWithNonexistentClass_ShouldReturnValidationErrorNotServerError()
    {
        using var response = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(
            HttpMethod.Post,
            "api/auth/register",
            new { name = $"{_fx.Prefix} Bad FK", email = $"{_fx.Prefix}-bad-fk@example.test", password = "Password123!", role = "Student", classId = Guid.NewGuid() }));

        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ProtectedEndpoint_MissingInvalidAndExpiredTokens_ShouldReturn401()
    {
        using var missing = await _fx.Client.GetAsync("api/users");
        missing.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        using var invalidRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/users");
        invalidRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-jwt");
        using var invalid = await _fx.Client.SendAsync(invalidRequest);
        invalid.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        using var expiredRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/users", _fx.CreateExpiredToken());
        using var expired = await _fx.Client.SendAsync(expiredRequest);
        expired.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithWrongRole_ShouldReturn403()
    {
        using var response = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/users", _fx.Teacher1Token));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
