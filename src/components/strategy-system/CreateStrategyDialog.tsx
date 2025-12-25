/**
 * Create/Edit Strategy Instance Dialog
 * 
 * Form for creating or editing strategy instances
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StrategyTemplate, StrategyInstance } from '@/types/strategy-system';
import { useCreateStrategyInstance, useUpdateStrategyInstance } from '@/hooks/useStrategyInstances';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CreateStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: StrategyTemplate;
  instance?: StrategyInstance;
}

const formSchema = z.object({
  name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  config: z.record(z.any()),
});

export function CreateStrategyDialog({
  open,
  onOpenChange,
  template,
  instance,
}: CreateStrategyDialogProps) {
  const isEdit = !!instance;
  const createMutation = useCreateStrategyInstance();
  const updateMutation = useUpdateStrategyInstance();
  const [willCreateVersion, setWillCreateVersion] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: instance?.name || '',
      description: instance?.description || '',
      config: instance?.config || template?.default_config || {},
    },
  });

  useEffect(() => {
    if (instance) {
      form.reset({
        name: instance.name,
        description: instance.description || '',
        config: instance.config,
      });
      setWillCreateVersion(instance.is_in_use);
    } else if (template) {
      form.reset({
        name: '',
        description: '',
        config: template.default_config,
      });
      setWillCreateVersion(false);
    }
  }, [instance, template, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEdit && instance) {
        await updateMutation.mutateAsync({
          instanceId: instance.id,
          dto: values,
        });
      } else if (template) {
        // Create new strategy instance with 'active' status
        await createMutation.mutateAsync({
          template_id: template.id,
          ...values,
          status: 'active', // Explicitly set status to 'active' for new strategies
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const currentTemplate = instance?.template || template;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل الاستراتيجية' : 'إنشاء استراتيجية جديدة'}
          </DialogTitle>
          <DialogDescription>
            {currentTemplate?.name} - {currentTemplate?.description}
          </DialogDescription>
        </DialogHeader>

        {willCreateVersion && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              هذه الاستراتيجية قيد الاستخدام. سيتم إنشاء نسخة جديدة (النسخة {(instance?.version || 0) + 1})
              بدلاً من تعديل النسخة الحالية.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الاستراتيجية *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: استراتيجية DCA للبيتكوين" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="وصف مختصر للاستراتيجية..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic Config Fields */}
            {currentTemplate?.schema?.fields?.map((fieldDef) => (
              <FormField
                key={fieldDef.key}
                control={form.control}
                name={`config.${fieldDef.key}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fieldDef.label}
                      {fieldDef.required && ' *'}
                    </FormLabel>
                    <FormControl>
                      {fieldDef.type === 'number' ? (
                        <Input
                          type="number"
                          step={fieldDef.step || 'any'}
                          min={fieldDef.min}
                          max={fieldDef.max}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      ) : fieldDef.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4"
                        />
                      ) : (
                        <Input {...field} />
                      )}
                    </FormControl>
                    {fieldDef.description && (
                      <FormDescription>{fieldDef.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'حفظ التغييرات' : 'إنشاء الاستراتيجية'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

