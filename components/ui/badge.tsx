interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gray";
  className?: string;
}

const variants = {
  default: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status: string): BadgeProps["variant"] {
  switch (status) {
    case "CUSTOMER": return "success";
    case "PROSPECT": return "info";
    case "LEAD": return "warning";
    case "INACTIVE": return "gray";
    default: return "default";
  }
}

export function getDealStageBadgeVariant(stage: string): BadgeProps["variant"] {
  switch (stage) {
    case "CLOSED_WON": return "success";
    case "CLOSED_LOST": return "danger";
    case "NEGOTIATION": return "warning";
    case "PROPOSAL": return "info";
    case "QUALIFICATION": return "default";
    case "PROSPECTING": return "gray";
    default: return "default";
  }
}
