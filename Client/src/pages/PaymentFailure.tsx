import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentFailure() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const method = params.get('method') || undefined;
  const reason = params.get('reason') || undefined;
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment Failed{method ? ` (${method})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Your payment could not be completed.</p>
          {reason && (
            <p className="text-sm text-muted-foreground">Reason: {reason}</p>
          )}
          <div className="mt-4"><Link className="text-thrift-green underline" to="/">Return Home</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
