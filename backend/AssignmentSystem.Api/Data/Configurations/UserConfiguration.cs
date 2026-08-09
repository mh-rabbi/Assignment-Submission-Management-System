using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(255).IsRequired();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.IsActive).HasDefaultValue(true);

        // Enum stored as string for readability
        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        // Unique email index
        builder.HasIndex(u => u.Email).IsUnique();

        // Student → Class relationship (nullable FK)
        builder.HasOne(u => u.Class)
            .WithMany(c => c.Students)
            .HasForeignKey(u => u.ClassId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}
