import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DebugUser() {
  const { user } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ المعرف إلى الحافظة',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات المستخدم الحالي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">User ID:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">
                {user?.id || 'غير متصل'}
              </code>
              {user?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Email:</p>
            <code className="block p-2 bg-muted rounded text-sm">
              {user?.email || 'غير متصل'}
            </code>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Created At:</p>
            <code className="block p-2 bg-muted rounded text-sm">
              {user?.created_at || 'غير متصل'}
            </code>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Full User Object:</p>
            <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

