import { Badge } from '~/components/ui/badge';

type ShopLike = {
  status: 'installed' | 'uninstalled';
  closed: boolean;
  plan: string | null;
};

/** Closed beats uninstalled beats installed — the worst state is the one worth seeing first. */
export function InstallBadge({ status, closed }: Pick<ShopLike, 'status' | 'closed'>) {
  if (closed) {
    return <Badge variant="destructive">Closed</Badge>;
  }
  return status === 'installed' ? (
    <Badge variant="success">Installed</Badge>
  ) : (
    <Badge variant="secondary">Uninstalled</Badge>
  );
}

export function PlanBadge({ plan }: Pick<ShopLike, 'plan'>) {
  if (!plan) {
    return <Badge variant="outline">Free</Badge>;
  }
  return <Badge variant={plan === 'basic' ? 'secondary' : 'default'}>{plan}</Badge>;
}

export function TokenBadge({ status }: { status: 'valid' | 'invalid' | null }) {
  if (status === 'valid') return <Badge variant="success">Valid</Badge>;
  if (status === 'invalid') return <Badge variant="destructive">Invalid</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}
