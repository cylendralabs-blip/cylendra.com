
import { supabase } from '@/integrations/supabase/client';

export class AdminAuthService {
  // التحقق من أن المستخدم مدير
  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (error) throw error;
    return data || false;
  }
}
