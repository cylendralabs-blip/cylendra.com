
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface BackupCodesProps {
  codes: string[];
}

const BackupCodes = ({ codes }: BackupCodesProps) => {
  const { toast } = useToast();

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الكود الاحتياطي"
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium">أكواد النسخ الاحتياطية</h4>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-secondary p-2 rounded border text-foreground"
          >
            <span className="font-mono text-sm text-primary font-semibold">{code}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyBackupCode(code)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupCodes;
