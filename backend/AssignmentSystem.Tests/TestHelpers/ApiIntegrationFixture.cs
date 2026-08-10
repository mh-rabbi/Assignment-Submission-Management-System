using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using AssignmentSystem.Api.DTOs.Auth;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AssignmentSystem.Tests.Integration;

public sealed class ApiIntegrationFixture : IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly Lazy<HttpClient> _client;

    public ApiIntegrationFixture()
    {
        var baseUrl = Environment.GetEnvironmentVariable("ASSIGNMENT_API_BASE_URL") ?? "http://localhost:8080";
        BaseUrl = new Uri(baseUrl.TrimEnd('/') + "/");
        DbConnectionString = Environment.GetEnvironmentVariable("ASSIGNMENT_TEST_DB")
            ?? "Host=localhost;Port=5432;Database=assignments_db;Username=postgres;Password=postgres";
        RunId = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss") + "_" + Guid.NewGuid().ToString("N")[..8];
        Prefix = $"qa-it-{RunId}";
        _client = new Lazy<HttpClient>(() => new HttpClient { BaseAddress = BaseUrl, Timeout = TimeSpan.FromSeconds(30) });
    }

    public Uri BaseUrl { get; }
    public string DbConnectionString { get; }
    public string RunId { get; }
    public string Prefix { get; }
    public HttpClient Client => _client.Value;

    public string AdminToken { get; private set; } = string.Empty;
    public string Teacher1Token { get; private set; } = string.Empty;
    public string Teacher2Token { get; private set; } = string.Empty;
    public string Student1Token { get; private set; } = string.Empty;
    public string Student3Token { get; private set; } = string.Empty;
    public SeedData Seed { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        var swagger = await Client.GetAsync("swagger/v1/swagger.json");
        swagger.StatusCode.Should().Be(System.Net.HttpStatusCode.OK, "the Docker API must be running before integration tests execute");

        AdminToken = (await LoginAsync("admin@school.test", "Admin@123")).Token;
        Teacher1Token = (await LoginAsync("teacher1@school.test", "Teacher@123")).Token;
        Teacher2Token = (await LoginAsync("teacher2@school.test", "Teacher@123")).Token;
        Student1Token = (await LoginAsync("student1@school.test", "Student@123")).Token;
        Student3Token = (await LoginAsync("student3@school.test", "Student@123")).Token;
        Seed = await LoadSeedDataAsync();
    }

    public async Task DisposeAsync()
    {
        await CleanupTestDataAsync();
        if (_client.IsValueCreated)
            Client.Dispose();
    }

    public string Unique(string label) => $"{Prefix}-{label}-{Guid.NewGuid():N}"[..Math.Min(100, $"{Prefix}-{label}-{Guid.NewGuid():N}".Length)];

    public async Task<AuthResponseDto> LoginAsync(string email, string password)
    {
        var response = await Client.PostAsJsonAsync("api/auth/login", new { email, password }, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions))!;
    }

    public static HttpRequestMessage JsonRequest(HttpMethod method, string path, object body, string? token = null)
    {
        var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };
        if (!string.IsNullOrEmpty(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    public static HttpRequestMessage EmptyRequest(HttpMethod method, string path, string? token = null)
    {
        var request = new HttpRequestMessage(method, path);
        if (!string.IsNullOrEmpty(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    public async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(JsonOptions);
        value.Should().NotBeNull();
        return value!;
    }

    public async Task<JsonNode> ReadJsonNodeAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonNode.Parse(json) ?? throw new InvalidOperationException("Response did not contain JSON.");
    }

    public async Task<Guid> CreateClassAsync(string name)
    {
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Post, "api/classes", new { name }, AdminToken));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        var json = await ReadJsonNodeAsync(response);
        return Guid.Parse(json["id"]!.GetValue<string>());
    }

    public async Task<Guid> CreateSubjectAsync(string name)
    {
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Post, "api/subjects", new { name }, AdminToken));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        var json = await ReadJsonNodeAsync(response);
        return Guid.Parse(json["id"]!.GetValue<string>());
    }

    public async Task<Guid> CreateUserAsync(string name, string email, string password, string role, Guid? classId = null)
    {
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Post, "api/users", new { name, email, password, role, classId }, AdminToken));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        var json = await ReadJsonNodeAsync(response);
        return Guid.Parse(json["id"]!.GetValue<string>());
    }

    public async Task<Guid> CreateTeacherAssignmentAsync(Guid teacherId, Guid subjectId, Guid classId)
    {
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Post, "api/teacher-assignments", new { teacherId, subjectId, classId }, AdminToken));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var json = await ReadJsonNodeAsync(response);
        return Guid.Parse(json["id"]!.GetValue<string>());
    }

    public async Task<Guid> CreateAssignmentAsync(string token, Guid subjectId, Guid classId, string title, DateTimeOffset? deadline = null, int maxMarks = 100, bool allowLateSubmission = false)
    {
        var body = new
        {
            title,
            description = $"{Prefix} assignment description",
            subjectId,
            classId,
            deadline = deadline ?? DateTimeOffset.UtcNow.AddDays(5),
            maxMarks,
            allowLateSubmission
        };
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Post, "api/assignments", body, token));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        var json = await ReadJsonNodeAsync(response);
        return Guid.Parse(json["id"]!.GetValue<string>());
    }

    public async Task PublishAssignmentAsync(Guid assignmentId, string token)
    {
        using var response = await Client.SendAsync(JsonRequest(HttpMethod.Patch, $"api/assignments/{assignmentId}/status", new { status = "Published" }, token));
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    public async Task<int> CountRowsAsync(string sql, params NpgsqlParameter[] parameters)
    {
        await using var connection = new NpgsqlConnection(DbConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddRange(parameters);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<SeedData> LoadSeedDataAsync()
    {
        await using var connection = new NpgsqlConnection(DbConnectionString);
        await connection.OpenAsync();
        var sql = """
            select
              (select "Id" from "Users" where "Email" = 'teacher1@school.test') as teacher1,
              (select "Id" from "Users" where "Email" = 'teacher2@school.test') as teacher2,
              (select "Id" from "Users" where "Email" = 'student1@school.test') as student1,
              (select "Id" from "Users" where "Email" = 'student3@school.test') as student3,
              (select "ClassId" from "Users" where "Email" = 'student1@school.test') as grade10,
              (select "ClassId" from "Users" where "Email" = 'student3@school.test') as grade11,
              (select "Id" from "Subjects" where "Name" = 'Mathematics') as math,
              (select "Id" from "Subjects" where "Name" = 'Physics') as physics,
              (select "Id" from "Subjects" where "Name" = 'English') as english;
            """;
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        await reader.ReadAsync();
        return new SeedData(
            reader.GetGuid(0),
            reader.GetGuid(1),
            reader.GetGuid(2),
            reader.GetGuid(3),
            reader.GetGuid(4),
            reader.GetGuid(5),
            reader.GetGuid(6),
            reader.GetGuid(7),
            reader.GetGuid(8));
    }

    public string CreateExpiredToken(string role = "Admin")
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "SUPER_SECRET_RABBI_IS_AWESOME_DEVELOPER";
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "AssignmentSystem";
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "AssignmentSystemClients";
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Email, $"{Prefix}-expired@example.test")
        };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer, audience, claims, notBefore: DateTime.UtcNow.AddHours(-2), expires: DateTime.UtcNow.AddHours(-1), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task CleanupTestDataAsync()
    {
        await using var connection = new NpgsqlConnection(DbConnectionString);
        await connection.OpenAsync();
        var sql = """
            delete from "SubmissionHistories"
            where "SubmissionId" in (
                select s."Id" from "Submissions" s
                left join "Assignments" a on a."Id" = s."AssignmentId"
                left join "Users" u on u."Id" = s."StudentId"
                where a."Title" like @pattern or s."Content" like @pattern or u."Email" like @pattern
            );

            delete from "Submissions"
            where "Id" in (
                select s."Id" from "Submissions" s
                left join "Assignments" a on a."Id" = s."AssignmentId"
                left join "Users" u on u."Id" = s."StudentId"
                where a."Title" like @pattern or s."Content" like @pattern or u."Email" like @pattern
            );

            delete from "Assignments" where "Title" like @pattern or "Description" like @pattern;

            delete from "TeacherSubjectClasses"
            where "TeacherId" in (select "Id" from "Users" where "Email" like @pattern)
               or "SubjectId" in (select "Id" from "Subjects" where "Name" like @pattern)
               or "ClassId" in (select "Id" from "Classes" where "Name" like @pattern);

            delete from "Users" where "Email" like @pattern;
            delete from "Subjects" where "Name" like @pattern;
            delete from "Classes" where "Name" like @pattern;
            """;
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("pattern", Prefix + "%");
        await command.ExecuteNonQueryAsync();
    }
}

public sealed record SeedData(
    Guid Teacher1Id,
    Guid Teacher2Id,
    Guid Student1Id,
    Guid Student3Id,
    Guid Grade10ClassId,
    Guid Grade11ClassId,
    Guid MathSubjectId,
    Guid PhysicsSubjectId,
    Guid EnglishSubjectId);
