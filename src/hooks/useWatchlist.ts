import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  display_order: number;
  created_at: string;
}

export const useWatchlist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['price-watchlist'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('price_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as WatchlistItem[];
    },
  });

  const addToWatchlist = useMutation({
    mutationFn: async (symbol: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const maxOrder = watchlist.reduce((max, item) => 
        Math.max(max, item.display_order), 0);

      const { error } = await supabase
        .from('price_watchlist')
        .insert({
          user_id: user.id,
          symbol,
          display_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watchlist'] });
      toast({
        title: 'Added to watchlist',
        description: 'Cryptocurrency added to your watchlist',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to watchlist',
        variant: 'destructive',
      });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (symbol: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('price_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watchlist'] });
      toast({
        title: 'Removed from watchlist',
        description: 'Cryptocurrency removed from your watchlist',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove from watchlist',
        variant: 'destructive',
      });
    },
  });

  const reorderWatchlist = useMutation({
    mutationFn: async (items: { symbol: string; display_order: number }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updates = items.map(item =>
        supabase
          .from('price_watchlist')
          .update({ display_order: item.display_order })
          .eq('user_id', user.id)
          .eq('symbol', item.symbol)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watchlist'] });
    },
  });

  return {
    watchlist,
    isLoading,
    addToWatchlist: addToWatchlist.mutate,
    removeFromWatchlist: removeFromWatchlist.mutate,
    reorderWatchlist: reorderWatchlist.mutate,
  };
};
