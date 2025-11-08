/**
 * Order Workflow Helper Functions / Sifariş İş Axını Köməkçi Funksiyaları
 * Handles order status transitions and validation
 * Sifariş status keçidləri və yoxlamalarını idarə edir
 */

import { OrderStatus } from "@prisma/client";

/**
 * Valid order status transitions for sellers
 * Satıcılar üçün etibarlı sifariş status keçidləri
 */
const SELLER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [], // Final status / Son status
  [OrderStatus.CANCELLED]: [], // Final status / Son status
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.CANCELLED],
};

/**
 * Check if a status transition is valid for a seller
 * Satıcı üçün status keçidinin etibarlı olub-olmadığını yoxla
 *
 * @param currentStatus Current order status / Cari sifariş statusu
 * @param newStatus New status to transition to / Keçid ediləcək yeni status
 * @returns boolean indicating if the transition is valid / Keçidin etibarlı olub-olmadığını göstərən boolean
 */
export function isValidSellerTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  // Same status is not a valid transition / Eyni status etibarlı keçid deyil
  if (currentStatus === newStatus) {
    return false;
  }

  // Check if the transition is allowed / Keçidin icazə verilən olub-olmadığını yoxla
  const allowedTransitions = SELLER_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed next statuses for a given current status
 * Verilmiş cari status üçün icazə verilən növbəti statusları al
 *
 * @param currentStatus Current order status / Cari sifariş statusu
 * @returns Array of allowed next statuses / İcazə verilən növbəti statusların massivi
 */
export function getAllowedNextStatuses(
  currentStatus: OrderStatus
): OrderStatus[] {
  return SELLER_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Get status transition error message
 * Status keçid xəta mesajını al
 *
 * @param currentStatus Current order status / Cari sifariş statusu
 * @param newStatus New status to transition to / Keçid ediləcək yeni status
 * @returns Error message / Xəta mesajı
 */
export function getTransitionErrorMessage(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): string {
  const allowedStatuses = getAllowedNextStatuses(currentStatus);
  
  if (allowedStatuses.length === 0) {
    return `Order is in final status and cannot be changed / Sifariş son statusdadır və dəyişdirilə bilməz`;
  }

  return `Invalid status transition. From ${currentStatus} you can only transition to: ${allowedStatuses.join(", ")} / Etibarsız status keçidi. ${currentStatus}-dən yalnız bu statuslara keçid edə bilərsiniz: ${allowedStatuses.join(", ")}`;
}

/**
 * Get human-readable status label
 * İnsan tərəfindən oxuna bilən status etiketi al
 *
 * @param status Order status / Sifariş statusu
 * @returns Human-readable label / İnsan tərəfindən oxuna bilən etiket
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Pending / Gözləyir",
    [OrderStatus.PENDING_PAYMENT]: "Pending Payment / Ödəniş gözləyir",
    [OrderStatus.CONFIRMED]: "Confirmed / Təsdiqlənib",
    [OrderStatus.PREPARING]: "Preparing / Hazırlanır",
    [OrderStatus.SHIPPED]: "Shipped / Göndərilib",
    [OrderStatus.DELIVERED]: "Delivered / Çatdırılıb",
    [OrderStatus.CANCELLED]: "Cancelled / Ləğv edilib",
    [OrderStatus.PAYMENT_FAILED]: "Payment Failed / Ödəniş uğursuz oldu",
  };

  return labels[status] || status;
}

