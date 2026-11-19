import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CropContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;
const PLAN_DETAILS_ENDPOINT = (planId) => `${API_BASE}/crop-plan/${planId}`;

const getStoredPlanId = () => {
  try {
    return localStorage.getItem('selectedCropPlanId');
  } catch {
    return null;
  }
};

const storePlanId = (planId) => {
  try {
    if (planId) {
      localStorage.setItem('selectedCropPlanId', planId);
    } else {
      localStorage.removeItem('selectedCropPlanId');
    }
  } catch {
    // ignore storage errors
  }
};

const getCachedPlans = () => {
  try {
    const raw = localStorage.getItem('cachedCropPlans');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const storeCachedPlans = (plans) => {
  try {
    localStorage.setItem('cachedCropPlans', JSON.stringify(plans));
  } catch {
    // ignore
  }
};

export function CropProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState(getCachedPlans());
  const [selectedPlanId, setSelectedPlanId] = useState(getStoredPlanId());
  const [planDetails, setPlanDetails] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState(null);
  const loadingPlanIds = useRef(new Set());
  const effectiveUserId = (isAuthenticated && user?.id) ? user.id : 'default_user';

  const refreshPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/crop-plan/user/${effectiveUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch crop plans');
      }
      const data = await response.json();
      const nextPlans = data.plans || [];
      setPlans(nextPlans);
      storeCachedPlans(nextPlans);

      setSelectedPlanId((prevId) => {
        const stillValid = nextPlans.some((p) => p.id === prevId);
        if (stillValid) return prevId;
        if (nextPlans.length > 0) {
          storePlanId(nextPlans[0].id);
          return nextPlans[0].id;
        }
        storePlanId(null);
        return null;
      });
    } catch (err) {
      console.warn('Could not refresh crop plans from server, using cached plans:', err);
      const cached = getCachedPlans();
      if (cached.length > 0) {
        setPlans(cached);
        if (!selectedPlanId) {
          setSelectedPlanId(cached[0].id);
        }
      }
    } finally {
      setLoadingPlans(false);
    }
  }, [effectiveUserId, selectedPlanId]);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  const selectPlan = useCallback((planId) => {
    setSelectedPlanId(planId);
    storePlanId(planId);
  }, []);

  const ensurePlanDetails = useCallback(async (planId) => {
    if (!planId || planDetails[planId] || loadingPlanIds.current.has(planId)) {
      return;
    }

    loadingPlanIds.current.add(planId);
    try {
      const response = await fetch(PLAN_DETAILS_ENDPOINT(planId));
      if (!response.ok) {
        throw new Error('Failed to fetch plan details');
      }
      const data = await response.json();
      setPlanDetails((prev) => ({
        ...prev,
        [planId]: data,
      }));
    } catch (err) {
      console.warn(`Failed to fetch details for plan ${planId}:`, err);
    } finally {
      loadingPlanIds.current.delete(planId);
    }
  }, [planDetails]);

  const removePlan = useCallback((planId) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    setPlanDetails((prev) => {
      const next = { ...prev };
      delete next[planId];
      return next;
    });
    if (selectedPlanId === planId) {
      setSelectedPlanId(null);
      storePlanId(null);
    }
  }, [selectedPlanId]);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) || null, [plans, selectedPlanId]);
  const selectedPlanDetails = useMemo(() => (selectedPlanId ? planDetails[selectedPlanId] || null : null), [planDetails, selectedPlanId]);

  const value = useMemo(() => ({
    plans,
    planDetails,
    selectedPlanId,
    selectedPlan,
    selectedPlanDetails,
    loadingPlans,
    error,
    setPlans,
    refreshPlans,
    selectPlan,
    ensurePlanDetails,
    removePlan,
  }), [plans, planDetails, selectedPlanId, selectedPlan, selectedPlanDetails, loadingPlans, error, setPlans, refreshPlans, selectPlan, ensurePlanDetails, removePlan]);

  return (
    <CropContext.Provider value={value}>
      {children}
    </CropContext.Provider>
  );
}

export function useCropContext() {
  const context = useContext(CropContext);
  if (!context) {
    throw new Error('useCropContext must be used within CropProvider');
  }
  return context;
}
