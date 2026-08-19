import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import {
  MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS,
  createMembershipPlanViaApi,
  deleteMembershipPlanViaApi,
  updateMembershipPlanViaApi,
} from '../api/membershipPlanWrites';
import { membershipCatalogQueryKey } from '../queryKeys';
import { buildMembershipPlanWriteBody } from '../utils/buildMembershipPlanWriteBody';

/**
 * Create / edit / delete membership plans via web API (Stripe sync).
 * @param {{ businessId: string | null | undefined }} args
 */
export function useMembershipPlanWrites({ businessId }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const bid = businessId ?? null;
  const accessToken = session?.access_token ?? null;

  const invalidateCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: membershipCatalogQueryKey(bid) });
  };

  const createMutation = useMutation({
    mutationFn: async (draft) => {
      const body = buildMembershipPlanWriteBody(draft, bid);
      if (!body.name) throw Object.assign(new Error('Name is required'), { httpStatus: 400 });
      if (!body.cadenceOptions.length) {
        throw Object.assign(new Error('Add at least one pricing option'), { httpStatus: 400 });
      }
      const result = await createMembershipPlanViaApi(accessToken, body);
      if (!result.ok) {
        throw Object.assign(result.error, {
          httpStatus: result.httpStatus,
          gate: result.gate,
          code: result.code,
        });
      }
      return result.plan;
    },
    onSuccess: invalidateCatalog,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ planId, draft }) => {
      const body = buildMembershipPlanWriteBody(draft, bid);
      if (!body.name) throw Object.assign(new Error('Name is required'), { httpStatus: 400 });
      if (!body.cadenceOptions.length) {
        throw Object.assign(new Error('Add at least one pricing option'), { httpStatus: 400 });
      }
      const result = await updateMembershipPlanViaApi(accessToken, planId, body);
      if (!result.ok) {
        throw Object.assign(result.error, {
          httpStatus: result.httpStatus,
          gate: result.gate,
          code: result.code,
        });
      }
      return result.plan;
    },
    onSuccess: invalidateCatalog,
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId) => {
      const result = await deleteMembershipPlanViaApi(accessToken, planId, { businessId: bid });
      if (!result.ok) {
        throw Object.assign(result.error, {
          httpStatus: result.httpStatus,
          gate: result.gate,
          code: result.code ?? null,
        });
      }
      return result;
    },
    onSuccess: invalidateCatalog,
  });

  return {
    createPlan: createMutation.mutateAsync,
    updatePlan: updateMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    hasSubscribersCode: MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS,
  };
}
