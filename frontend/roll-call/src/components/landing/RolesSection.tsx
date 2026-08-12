import { RoleStamp } from '@/components/ui/Badge';

export function RolesSection() {
  return (
    <section id="roles" className="wrap">
      <div className="section-head reveal">
        <p className="eyebrow">Entry 02 — three roles, one ledger</p>
        <h2>Everyone sees exactly what's theirs.</h2>
      </div>
      <div className="role-grid reveal">
        <div className="glass role-card">
          <RoleStamp role="Admin" size="lg" />
          <h3>Admin</h3>
          <p>Sets up classes, subjects, teachers, and who's teaching what.</p>
        </div>
        <div className="glass role-card">
          <RoleStamp role="Teacher" size="lg" />
          <h3>Teacher</h3>
          <p>Publishes assignments to their classes, reviews submissions, grades work.</p>
        </div>
        <div className="glass role-card">
          <RoleStamp role="Student" size="lg" />
          <h3>Student</h3>
          <p>Sees only what's published to their class, submits before the deadline.</p>
        </div>
      </div>
    </section>
  );
}
