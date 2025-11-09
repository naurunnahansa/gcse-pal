'use client';

import { createOrganizationAction } from '@/app/actions/organization-actions';
import { Button } from '@/components/ui/button';
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
import { createOrganizationSchema, type CreateOrganizationInput } from '@/lib/schemas/organization';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function CreateOrganizationForm() {
  const router = useRouter();
  const { execute, isExecuting } = useAction(createOrganizationAction, {
    onSuccess: () => {
      toast.success('Organization created successfully!');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Failed to create organization. Please try again.');
    },
  });

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      domain: '',
    },
  });

  async function onSubmit(values: CreateOrganizationInput) {
    execute(values);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    {...field}
                    disabled={isExecuting}
                    autoComplete="organization"
                  />
                </FormControl>
                <FormDescription>
                  This will be your organization's display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="acme.com"
                    {...field}
                    disabled={isExecuting}
                    autoComplete="off"
                  />
                </FormControl>
                <FormDescription>
                  Your company domain for team member identification.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isExecuting}
          >
            {isExecuting ? 'Creating Organization...' : 'Create Organization'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
