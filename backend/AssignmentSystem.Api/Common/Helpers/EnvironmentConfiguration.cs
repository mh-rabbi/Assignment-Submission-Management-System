using System.Data.Common;
using Microsoft.Extensions.Configuration;

namespace AssignmentSystem.Api.Common.Helpers;

public static class EnvironmentConfiguration
{
    private const string EnvFileName = ".env";

    public static void LoadDotEnv()
    {
        var path = FindDotEnvPath();
        if (path is null)
            return;

        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
                continue;

            if (line.StartsWith("export ", StringComparison.Ordinal))
                line = line["export ".Length..].TrimStart();

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
                continue;

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (key.Length == 0 || Environment.GetEnvironmentVariable(key) is not null)
                continue;

            Environment.SetEnvironmentVariable(key, Unquote(value));
        }
    }

    public static string GetPostgresConnectionString(IConfiguration configuration)
    {
        var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configuredConnectionString))
            return configuredConnectionString;

        var builder = new DbConnectionStringBuilder
        {
            ["Host"] = configuration["POSTGRES_HOST"] ?? "localhost",
            ["Port"] = configuration["POSTGRES_PORT"] ?? "5432",
            ["Database"] = GetRequired(configuration, "POSTGRES_DB"),
            ["Username"] = GetRequired(configuration, "POSTGRES_USER"),
            ["Password"] = GetRequired(configuration, "POSTGRES_PASSWORD")
        };

        return builder.ConnectionString;
    }

    public static string GetRequired(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        if (!string.IsNullOrWhiteSpace(value))
            return value;

        throw new InvalidOperationException(
            $"{key} is not configured. Copy backend/.env.example to backend/.env and set {key}, or provide it as an environment variable.");
    }

    private static string? FindDotEnvPath()
    {
        var candidates = new List<string>();

        foreach (var root in GetSearchRoots())
        {
            candidates.Add(Path.Combine(root, EnvFileName));
            candidates.Add(Path.Combine(root, "backend", EnvFileName));
        }

        return candidates
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(File.Exists);
    }

    private static IEnumerable<string> GetSearchRoots()
    {
        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var directory = new DirectoryInfo(start);
            for (var i = 0; directory is not null && i < 8; i++, directory = directory.Parent)
                yield return directory.FullName;
        }
    }

    private static string Unquote(string value)
    {
        if (value.Length >= 2 &&
            ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
        {
            return value[1..^1];
        }

        return value;
    }
}
