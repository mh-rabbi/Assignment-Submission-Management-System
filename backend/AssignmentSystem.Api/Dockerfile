FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["AssignmentSystem.Api/AssignmentSystem.Api.csproj", "AssignmentSystem.Api/"]
RUN dotnet restore "AssignmentSystem.Api/AssignmentSystem.Api.csproj"
COPY . .
WORKDIR "/src/AssignmentSystem.Api"
RUN dotnet build "AssignmentSystem.Api.csproj" -c Release -o /app/build
RUN dotnet publish "AssignmentSystem.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AssignmentSystem.Api.dll"]
