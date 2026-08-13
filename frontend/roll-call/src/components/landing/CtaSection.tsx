import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CtaSection() {
  return (
    <section className="wrap">
      <div className="glass final-cta reveal">
        <h2>Ready to take roll?</h2>
        <p>Sign in if you're already on the register. Otherwise, get set up in a minute.</p>
        <Link href="/auth">
          <Button variant="primary" size="lg">
            Wanna join the system?
          </Button>
        </Link>
      </div>
    </section>
  );
}
