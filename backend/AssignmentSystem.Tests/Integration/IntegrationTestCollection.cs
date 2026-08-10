namespace AssignmentSystem.Tests.Integration;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class IntegrationTestCollection : ICollectionFixture<ApiIntegrationFixture>
{
    public const string Name = "ApiIntegration";
}
