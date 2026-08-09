using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace AssignmentSystem.Api.Common.Helpers;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("Invalid user claims: sub not found.");

        return userId;
    }

    public static string GetRole(this ClaimsPrincipal user)
    {
        var role = user.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrEmpty(role))
            throw new UnauthorizedAccessException("Invalid user claims: role not found.");

        return role;
    }

    public static Guid? GetClassId(this ClaimsPrincipal user)
    {
        var classIdClaim = user.FindFirstValue("classId");
        if (!string.IsNullOrEmpty(classIdClaim) && Guid.TryParse(classIdClaim, out var classId))
            return classId;

        return null;
    }
}
