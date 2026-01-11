import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, getUserCrafts, createCraft as createSupabaseCraft, uploadCraftImage } from '../utils/supabase';

const CraftsContext = createContext();

export function CraftsProvider({ children }) {
  const [crafts, setCrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  // Listen for auth changes and load crafts
  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          await loadCrafts(session.user.id);
        } else {
          setAuthUser(null);
          loadMockCrafts();
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        await loadCrafts(session.user.id);
      } else {
        // No authenticated user - use mock data
        loadMockCrafts();
      }
    } catch (error) {
      console.error('Session check error:', error);
      loadMockCrafts();
    } finally {
      setLoading(false);
    }
  };

  const loadMockCrafts = () => {
    // Load mock crafts for demo/development
    setCrafts([
      { 
        id: 1, 
        name: "Robot Pencil Holder", 
        emoji: "🤖", 
        completedDate: "Jan 8", 
        points: 75,
      },
      { 
        id: 2, 
        name: "Cardboard Birdhouse", 
        emoji: "🏠", 
        completedDate: "Jan 5", 
        points: 100,
      },
      { 
        id: 3, 
        name: "Bottle Cap Art", 
        emoji: "🎨", 
        completedDate: "Jan 3", 
        points: 50,
      },
    ]);
  };

  const loadCrafts = async (userId) => {
    try {
      const userCrafts = await getUserCrafts(userId);
      
      const formattedCrafts = userCrafts.map(craft => ({
        id: craft.id,
        name: craft.name,
        emoji: craft.emoji || '🎨',
        completedDate: new Date(craft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: craft.points_earned || 75,
        photoUri: craft.photo_url,
        aiPreviewUrl: craft.ai_preview_url,
        materials: craft.materials,
        difficulty: craft.difficulty,
        instructions: craft.instructions,
      }));

      setCrafts(formattedCrafts);
    } catch (error) {
      console.error('Error loading crafts:', error);
    }
  };

  const addCraft = async (newCraft) => {
    if (!authUser) {
      console.error('No authenticated user');
      return null;
    }

    try {
      // Upload photo if provided
      let photoUrl = null;
      if (newCraft.photoUri) {
        // If it's a base64 string, upload it
        if (typeof newCraft.photoUri === 'string' && newCraft.photoUri.includes('base64')) {
          const base64Data = newCraft.photoUri.split(',')[1];
          photoUrl = await uploadCraftImage(authUser.id, base64Data);
        } else {
          photoUrl = newCraft.photoUri;
        }
      }

      // Create craft in database
      const craftData = {
        name: newCraft.name || "My Craft",
        emoji: newCraft.emoji || "🎨",
        photo_url: photoUrl,
        ai_preview_url: newCraft.aiPreviewUrl,
        materials: newCraft.materials || [],
        difficulty: newCraft.difficulty || 'easy',
        instructions: newCraft.instructions,
        points_earned: newCraft.points || 75,
        template_id: newCraft.templateId,
        source_scan_id: newCraft.sourceScanId,
      };

      const savedCraft = await createSupabaseCraft(authUser.id, craftData);

      // Add to local state
      const craft = {
        id: savedCraft.id,
        name: savedCraft.name,
        emoji: savedCraft.emoji || "🎨",
        completedDate: new Date(savedCraft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: savedCraft.points_earned || 75,
        photoUri: savedCraft.photo_url,
        aiPreviewUrl: savedCraft.ai_preview_url,
        materials: savedCraft.materials,
        difficulty: savedCraft.difficulty,
        instructions: savedCraft.instructions,
      };

      setCrafts(prev => [craft, ...prev]);
      return craft;
    } catch (error) {
      console.error('Error adding craft:', error);
      return null;
    }
  };

  const getTotalCrafts = () => crafts.length;
  const getTotalCraftPoints = () => crafts.reduce((sum, c) => sum + c.points, 0);

  return (
    <CraftsContext.Provider value={{ 
      crafts, 
      addCraft, 
      getTotalCrafts, 
      getTotalCraftPoints,
      loading,
      refreshCrafts: () => authUser && loadCrafts(authUser.id),
    }}>
      {children}
    </CraftsContext.Provider>
  );
}

export function useCrafts() {
  const context = useContext(CraftsContext);
  if (!context) {
    throw new Error('useCrafts must be used within a CraftsProvider');
  }
  return context;
}

