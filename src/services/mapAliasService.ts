"use client";

import { supabase } from "@/integrations/supabase/client";

export interface MapAlias {
  id: string;
  alias: string;
  title: string;
  city: string | null;
  category: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

export const mapAliasService = {
  /**
   * Normalizes the input query for alias matching
   */
  normalizeQuery(query: string): string {
    let low = query.toLowerCase().trim();
    
    // Replace common shortcuts
    low = low.replace(/жд/g, "железнодорожный");
    low = low.replace(/ж\/д/g, "железнодорожный");
    low = low.replace(/ж\.д\./g, "железнодорожный");
    
    // Standardize spacing
    return low.replace(/\s+/g, " ");
  },

  /**
   * Searches for a local alias match in the database
   */
  async searchMapAlias(query: string): Promise<MapAlias[]> {
    const normalized = this.normalizeQuery(query);
    
    console.log(`[ALIAS SEARCH]`);
    console.log(`query: "${query}"`);
    console.log(`normalized: "${normalized}"`);

    try {
      if (!supabase) return [];

      // We search for matches where the alias is contained within the query
      // or the query matches the alias exactly
      const { data, error } = await supabase
        .from("map_aliases")
        .select("*");

      if (error) throw error;

      // Local filtering for smarter matching (checking if alias exists in normalized query)
      const matches = (data as MapAlias[]).filter(item => {
        const itemAlias = item.alias.toLowerCase();
        return normalized.includes(itemAlias) || itemAlias.includes(normalized);
      });

      console.log(`found: ${matches.length}`);
      if (matches.length > 0) {
        console.log(`result:`, matches[0]);
      }

      return matches;
    } catch (err) {
      console.warn("[Alias Search Error]", err);
      return [];
    }
  },

  async addAlias(alias: Partial<MapAlias>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from("map_aliases").insert(alias).select().single();
    if (error) throw error;
    return data;
  },

  async updateAlias(id: string, alias: Partial<MapAlias>) {
    if (!supabase) return null;
    const { error } = await supabase.from("map_aliases").update(alias).eq("id", id);
    if (error) throw error;
    return true;
  },

  async deleteAlias(id: string) {
    if (!supabase) return null;
    const { error } = await supabase.from("map_aliases").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
};