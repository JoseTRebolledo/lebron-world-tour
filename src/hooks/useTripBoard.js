/* eslint-disable import/prefer-default-export */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeTripMeta } from '../helpers/constants';

const SAVE_DEBOUNCE_MS = 500;
const CACHE_PREFIX = 'lebron-world-tour-trip-cache:';

const normalizeBoard = (board) => ({
  meta: normalizeTripMeta(board?.meta),
  days: Array.isArray(board?.days) ? board.days : [],
});

const emptyBoard = () => ({ meta: normalizeTripMeta({}), days: [] });

const readLocalCache = (tripId) => {
  if (!tripId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${tripId}`);
    if (!raw) return null;
    return normalizeBoard(JSON.parse(raw));
  } catch (error) {
    return null;
  }
};

const writeLocalCache = (tripId, board) => {
  if (!tripId) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify(normalizeBoard(board)));
  } catch (error) {
    // ignore
  }
};

/**
 * Load / save a trip board by tripId for an authenticated member.
 */
const useTripBoard = ({
  userId,
  tripId,
  onError,
} = {}) => {
  const [board, setBoardState] = useState(emptyBoard);
  const [memberRole, setMemberRole] = useState(null);
  const [shareMode, setShareMode] = useState('off');
  const [activeShareToken, setActiveShareToken] = useState(null);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [saving, setSaving] = useState(false);

  const saveTimer = useRef(null);
  const latestBoard = useRef(board);
  const tripIdRef = useRef(tripId);

  const isOwner = memberRole === 'owner';
  const readOnly = false;

  useEffect(() => {
    tripIdRef.current = tripId;
  }, [tripId]);

  const persistBoard = useCallback(async (nextBoard) => {
    if (!supabase || !userId || !tripIdRef.current) return;
    const payload = normalizeBoard(nextBoard);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          board_json: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripIdRef.current);

      if (error) throw error;
      writeLocalCache(tripIdRef.current, payload);
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo guardar el itinerario');
    } finally {
      setSaving(false);
    }
  }, [userId, onError]);

  const scheduleSave = useCallback((nextBoard) => {
    latestBoard.current = nextBoard;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistBoard(latestBoard.current);
    }, SAVE_DEBOUNCE_MS);
  }, [persistBoard]);

  const setBoard = useCallback((dispatcher) => {
    setBoardState((prev) => {
      const nextValue = typeof dispatcher === 'function' ? dispatcher(prev) : dispatcher;
      const normalized = normalizeBoard(nextValue);
      latestBoard.current = normalized;
      scheduleSave(normalized);
      return normalized;
    });
  }, [scheduleSave]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!tripId || !userId || !supabase) {
        setLoading(false);
        setBoardState(emptyBoard());
        setMemberRole(null);
        return;
      }

      setLoading(true);
      try {
        const { data: trip, error } = await supabase
          .from('trips')
          .select('id, board_json, share_token, share_mode, updated_at')
          .eq('id', tripId)
          .single();

        if (error) throw error;
        if (cancelled) return;

        const { data: membership, error: memberError } = await supabase
          .from('trip_members')
          .select('role')
          .eq('trip_id', tripId)
          .eq('user_id', userId)
          .maybeSingle();

        if (memberError) throw memberError;
        if (!membership) throw new Error('No sos miembro de este viaje');

        const nextBoard = normalizeBoard(trip.board_json);
        setBoardState(nextBoard);
        latestBoard.current = nextBoard;
        setMemberRole(membership.role);
        setShareMode(trip.share_mode || 'off');
        setActiveShareToken(trip.share_token || null);
        writeLocalCache(tripId, nextBoard);
      } catch (error) {
        if (cancelled) return;
        const cached = readLocalCache(tripId);
        if (cached) {
          setBoardState(cached);
          latestBoard.current = cached;
          if (onError) onError(`${error.message || 'Error de red'}. Mostrando cache local.`);
        } else if (onError) {
          onError(error.message || 'No se pudo cargar el itinerario');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [tripId, userId, onError]);

  const enableSharing = useCallback(async () => {
    if (!supabase || !tripIdRef.current || !isOwner) {
      throw new Error('Solo el owner puede generar el link de invitación');
    }
    const { data, error } = await supabase.rpc('set_trip_share_token', {
      p_trip_id: tripIdRef.current,
      p_enable: true,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    setActiveShareToken(row.share_token);
    setShareMode(row.share_mode);
    return `${window.location.origin}/?share=${row.share_token}`;
  }, [isOwner]);

  const disableSharing = useCallback(async () => {
    if (!supabase || !tripIdRef.current || !isOwner) {
      throw new Error('Solo el owner puede revocar el link');
    }
    const { error } = await supabase.rpc('set_trip_share_token', {
      p_trip_id: tripIdRef.current,
      p_enable: false,
    });
    if (error) throw error;
    setActiveShareToken(null);
    setShareMode('off');
  }, [isOwner]);

  const shareUrl = (activeShareToken && shareMode !== 'off')
    ? `${window.location.origin}/?share=${activeShareToken}`
    : null;

  return {
    board,
    setBoard,
    loading,
    saving,
    readOnly,
    isOwner,
    memberRole,
    shareMode,
    shareUrl,
    enableSharing,
    disableSharing,
    tripId,
  };
};

export default useTripBoard;
