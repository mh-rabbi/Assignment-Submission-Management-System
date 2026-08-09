using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Api.Data.Configurations;

public class SubmissionHistoryConfiguration : IEntityTypeConfiguration<SubmissionHistory>
{
    public void Configure(EntityTypeBuilder<SubmissionHistory> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Content).IsRequired();
        builder.Property(h => h.FilePath).IsRequired(false);

        // Cascade: history dies with the parent submission
        builder.HasOne(h => h.Submission)
            .WithMany(s => s.History)
            .HasForeignKey(h => h.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
