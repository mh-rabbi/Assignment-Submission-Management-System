using AssignmentSystem.Api.Data.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AssignmentSystem.Api.Common.Helpers;

public static class JwtHelper
{
    public static (string token, DateTime expiresAt) GenerateToken(
        User user, IConfiguration config)
    {
        var secret = EnvironmentConfiguration.GetRequired(config, "JWT_SECRET");
        var issuer = config["JWT_ISSUER"] ?? "AssignmentSystem";
        var audience = config["JWT_AUDIENCE"] ?? "AssignmentSystemClients";
        var expiryMinutes = int.Parse(config["JWT_EXPIRY_MINUTES"] ?? "60");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.ClassId.HasValue)
            claims.Add(new Claim("classId", user.ClassId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
