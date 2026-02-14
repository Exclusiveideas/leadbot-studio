"use client";

import { ReactNode } from "react";
import { AlertTriangle, Trash2, Edit3, Shield, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: ReactNode;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          defaultIcon: <Trash2 className="w-6 h-6" />,
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          confirmButton:
            "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
      case "info":
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          defaultIcon: <Edit3 className="w-6 h-6" />,
        };
      default:
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          defaultIcon: <Trash2 className="w-6 h-6" />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-md transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Close Button */}
          {!isLoading && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}
            >
              <div className={styles.iconColor}>
                {icon || styles.defaultIcon}
              </div>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${styles.confirmButton} disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized dialog variants for common use cases
export function DeleteMemberDialog({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Remove Member"
      message={`Are you sure you want to remove ${memberName} from this organization? This action cannot be undone and they will lose access to all organization resources.`}
      confirmText="Remove Member"
      variant="danger"
      icon={<Trash2 className="w-6 h-6" />}
      isLoading={isLoading}
    />
  );
}

export function ChangeRoleDialog({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  currentRole,
  newRole,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  currentRole: string;
  newRole: string;
  isLoading?: boolean;
}) {
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: "Administrator",
      member: "Member",
      creator: "Creator",
    };
    return roleMap[role] || role;
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Change Member Role"
      message={`Are you sure you want to change ${memberName}'s role from ${getRoleDisplayName(currentRole)} to ${getRoleDisplayName(newRole)}? This will immediately update their access permissions.`}
      confirmText="Change Role"
      variant="warning"
      icon={<Edit3 className="w-6 h-6" />}
      isLoading={isLoading}
    />
  );
}

export function CreatorProtectionDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title="Creator Protection"
      message="The organization creator's role and membership cannot be modified or removed. This is a security protection to ensure organizational integrity."
      confirmText="Understood"
      cancelText=""
      variant="info"
      icon={<Shield className="w-6 h-6" />}
    />
  );
}
