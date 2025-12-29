/**
 * Vote on Signal Edge Function
 * 
 * Phase X.12 - Community Signals System
 * 
 * Handles voting on community signals and updates stats
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('vote-on-signal');

/**
 * Update signal vote counts
 */
async function updateSignalVotes(
  supabaseClient: ReturnType<typeof createClient>,
  signalId: string
): Promise<void> {
  const { data: votes } = await supabaseClient
    .from('community_signal_votes')
    .select('vote')
    .eq('signal_id', signalId);

  const upvotes = votes?.filter(v => v.vote === 1).length || 0;
  const downvotes = votes?.filter(v => v.vote === -1).length || 0;
  const totalVotes = votes?.length || 0;

  await supabaseClient
    .from('community_signals')
    .update({
      upvotes,
      downvotes,
      total_votes: totalVotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', signalId);
}

/**
 * Update user LP points
 */
async function updateUserLP(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  points: number
): Promise<void> {
  const { data: stats } = await supabaseClient
    .from('community_trader_stats')
    .select('lp_points')
    .eq('user_id', userId)
    .maybeSingle();

  const currentLP = stats?.lp_points || 0;
  const newLP = Math.max(0, currentLP + points);

  await supabaseClient
    .from('community_trader_stats')
    .upsert({
      user_id: userId,
      lp_points: newLP,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { signal_id, vote } = body;

      if (!signal_id || (vote !== 1 && vote !== -1)) {
        return new Response(
          JSON.stringify({ error: 'signal_id and vote (+1 or -1) required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if user already voted
      const { data: existingVote } = await supabaseClient
        .from('community_signal_votes')
        .select('*')
        .eq('signal_id', signal_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Update existing vote
        if (existingVote.vote === vote) {
          // Same vote, remove it (toggle off)
          await supabaseClient
            .from('community_signal_votes')
            .delete()
            .eq('id', existingVote.id);

          // Update signal vote counts
          await updateSignalVotes(supabaseClient, signal_id);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Vote removed',
              vote: 0,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else {
          // Different vote, update it
          await supabaseClient
            .from('community_signal_votes')
            .update({ vote })
            .eq('id', existingVote.id);

          // Update signal vote counts
          await updateSignalVotes(supabaseClient, signal_id);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Vote updated',
              vote,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      } else {
        // New vote
        const { error: insertError } = await supabaseClient
          .from('community_signal_votes')
          .insert({
            signal_id,
            user_id: user.id,
            vote,
          });

        if (insertError) {
          logger.error('Error inserting vote:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to vote' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Update signal vote counts
        await updateSignalVotes(supabaseClient, signal_id);

        // Give LP points to voter (only for upvotes)
        if (vote === 1) {
          await updateUserLP(supabaseClient, user.id, 1);
        }

        // Get signal owner and give them LP points for receiving upvote
        const { data: signal } = await supabaseClient
          .from('community_signals')
          .select('user_id')
          .eq('id', signal_id)
          .maybeSingle();

        if (signal && vote === 1 && signal.user_id !== user.id) {
          await updateUserLP(supabaseClient, signal.user_id, 1);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Vote recorded',
            vote,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // GET - Get user's vote for a signal
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const signalId = url.searchParams.get('signal_id');

      if (!signalId) {
        return new Response(
          JSON.stringify({ error: 'signal_id required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: vote } = await supabaseClient
        .from('community_signal_votes')
        .select('vote')
        .eq('signal_id', signalId)
        .eq('user_id', user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          vote: vote?.vote || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

