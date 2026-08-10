using System.Net;
using FluentAssertions;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class ApiContractTests
{
    private readonly ApiIntegrationFixture _fx;

    public ApiContractTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task Swagger_OpenApiSpec_ShouldExposeAllControllerEndpoints()
    {
        using var response = await _fx.Client.GetAsync("swagger/v1/swagger.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var root = await _fx.ReadJsonNodeAsync(response);
        var paths = root["paths"]!.AsObject();
        var operations = paths.SelectMany(p => p.Value!.AsObject().Select(m => $"{m.Key.ToUpperInvariant()} {p.Key}")).Order().ToArray();

        operations.Should().HaveCount(36);
        operations.Should().Contain(new[]
        {
            "POST /api/auth/login",
            "POST /api/auth/register",
            "GET /api/users",
            "POST /api/classes",
            "POST /api/subjects",
            "POST /api/teacher-assignments",
            "POST /api/assignments",
            "POST /api/submissions",
            "GET /api/submissions/{id}/file"
        });
    }

    [Fact]
    public async Task MalformedJson_ShouldReturnStructuredBadRequest()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/auth/login")
        {
            Content = new StringContent("{ not-json", System.Text.Encoding.UTF8, "application/json")
        };

        using var response = await _fx.Client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType!.MediaType.Should().Contain("application");
    }
}
