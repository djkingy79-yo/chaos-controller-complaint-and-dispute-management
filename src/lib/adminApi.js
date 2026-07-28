import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { isAdminUser } from "@/lib/subscription";
import { invokeBase44Function } from "@/lib/invoke";

export function useAdminSnapshot() {
  const { user } = useAuth();
  const enabled = isAdminUser(user);

  return useQuery({
    queryKey: ["admin-snapshot"],
    queryFn: async () => {
      return invokeBase44Function("adminData", {}, { requireSuccess: true });
    },
    enabled,
    staleTime: 30000,
  });
}

export function useAdminPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, action }) =>
      invokeBase44Function("adminManagePayment", { paymentId, action }, { requireSuccess: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-snapshot"] }),
  });
}
