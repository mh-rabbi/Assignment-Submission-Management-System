using System.Net;
using FluentAssertions;
using Npgsql;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class ClassSubjectUserTests
{
    private readonly ApiIntegrationFixture _fx;

    public ClassSubjectUserTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task Classes_FullCrudValidationDuplicateAndPersistence_ShouldBehaveCorrectly()
    {
        var name = $"{_fx.Prefix}-Class";
        var id = await _fx.CreateClassAsync(name);

        (await _fx.CountRowsAsync(@"select count(*) from ""Classes"" where ""Id"" = @id and ""Name"" = @name",
            new NpgsqlParameter("id", id), new NpgsqlParameter("name", name))).Should().Be(1);

        using var all = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/classes", _fx.AdminToken));
        all.StatusCode.Should().Be(HttpStatusCode.OK);

        using var get = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/classes/{id}", _fx.AdminToken));
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        using var missingRequired = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/classes", new { name = "" }, _fx.AdminToken));
        missingRequired.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var updatedName = $"{_fx.Prefix}-Class-Updated";
        using var update = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/classes/{id}", new { name = updatedName }, _fx.AdminToken));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _fx.CountRowsAsync(@"select count(*) from ""Classes"" where ""Id"" = @id and ""Name"" = @name",
            new NpgsqlParameter("id", id), new NpgsqlParameter("name", updatedName))).Should().Be(1);

        using var badUpdate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/classes/{Guid.NewGuid()}", new { name = updatedName }, _fx.AdminToken));
        badUpdate.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var invalidId = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/classes/not-a-guid", _fx.AdminToken));
        invalidId.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var delete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/classes/{id}", _fx.AdminToken));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _fx.CountRowsAsync(@"select count(*) from ""Classes"" where ""Id"" = @id and ""IsActive"" = false",
            new NpgsqlParameter("id", id))).Should().Be(1);

        using var getAfterDelete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/classes/{id}", _fx.AdminToken));
        getAfterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Classes_CreateDuplicateName_ShouldReturnConflictOrValidationError()
    {
        var name = $"{_fx.Prefix}-Duplicate-Class";
        await _fx.CreateClassAsync(name);

        using var duplicate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/classes", new { name }, _fx.AdminToken));

        duplicate.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Subjects_FullCrudValidationDuplicateAndPersistence_ShouldBehaveCorrectly()
    {
        var name = $"{_fx.Prefix}-Subject";
        var id = await _fx.CreateSubjectAsync(name);

        (await _fx.CountRowsAsync(@"select count(*) from ""Subjects"" where ""Id"" = @id and ""Name"" = @name",
            new NpgsqlParameter("id", id), new NpgsqlParameter("name", name))).Should().Be(1);

        using var get = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/subjects/{id}", _fx.AdminToken));
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        using var missingRequired = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/subjects", new { name = "" }, _fx.AdminToken));
        missingRequired.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var updatedName = $"{_fx.Prefix}-Subject-Updated";
        using var update = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/subjects/{id}", new { name = updatedName }, _fx.AdminToken));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _fx.CountRowsAsync(@"select count(*) from ""Subjects"" where ""Id"" = @id and ""Name"" = @name",
            new NpgsqlParameter("id", id), new NpgsqlParameter("name", updatedName))).Should().Be(1);

        using var delete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/subjects/{id}", _fx.AdminToken));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _fx.CountRowsAsync(@"select count(*) from ""Subjects"" where ""Id"" = @id and ""IsActive"" = false",
            new NpgsqlParameter("id", id))).Should().Be(1);

        using var getAfterDelete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/subjects/{id}", _fx.AdminToken));
        getAfterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Subjects_CreateDuplicateName_ShouldReturnConflictOrValidationError()
    {
        var name = $"{_fx.Prefix}-Duplicate-Subject";
        await _fx.CreateSubjectAsync(name);

        using var duplicate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/subjects", new { name }, _fx.AdminToken));

        duplicate.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Users_FullCrudValidationAuthAndPersistence_ShouldBehaveCorrectly()
    {
        var email = $"{_fx.Prefix}-student@example.test";
        var id = await _fx.CreateUserAsync($"{_fx.Prefix} Student", email, "Password123!", "Student", _fx.Seed.Grade10ClassId);

        (await _fx.CountRowsAsync(@"select count(*) from ""Users"" where ""Id"" = @id and ""Email"" = @email and ""IsActive"" = true",
            new NpgsqlParameter("id", id), new NpgsqlParameter("email", email))).Should().Be(1);

        using var all = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/users", _fx.AdminToken));
        all.StatusCode.Should().Be(HttpStatusCode.OK);

        using var get = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/users/{id}", _fx.AdminToken));
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        using var duplicate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/users",
            new { name = $"{_fx.Prefix} Dup", email, password = "Password123!", role = "Student", classId = _fx.Seed.Grade10ClassId }, _fx.AdminToken));
        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var missingClass = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/users",
            new { name = $"{_fx.Prefix} Missing Class", email = $"{_fx.Prefix}-missing-class@example.test", password = "Password123!", role = "Student" }, _fx.AdminToken));
        missingClass.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var updatedEmail = $"{_fx.Prefix}-student-updated@example.test";
        using var update = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/users/{id}",
            new { name = $"{_fx.Prefix} Student Updated", email = updatedEmail }, _fx.AdminToken));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _fx.CountRowsAsync(@"select count(*) from ""Users"" where ""Id"" = @id and ""Email"" = @email",
            new NpgsqlParameter("id", id), new NpgsqlParameter("email", updatedEmail))).Should().Be(1);

        using var missingUpdate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/users/{Guid.NewGuid()}",
            new { name = "No One" }, _fx.AdminToken));
        missingUpdate.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var delete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/users/{id}", _fx.AdminToken));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _fx.CountRowsAsync(@"select count(*) from ""Users"" where ""Id"" = @id and ""IsActive"" = false",
            new NpgsqlParameter("id", id))).Should().Be(1);

        using var loginDeleted = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/auth/login",
            new { email = updatedEmail, password = "Password123!" }));
        loginDeleted.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
