
import * as React from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const notificationAlertVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-sm transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
        success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900",
        warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
        error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

export interface NotificationAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationAlertVariants> {
  title?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
  showCloseButton?: boolean;
}

const NotificationAlert = React.forwardRef<HTMLDivElement, NotificationAlertProps>(
  (
    {
      className,
      variant = "default",
      title,
      children,
      onClose,
      icon,
      showCloseButton = true,
      ...props
    },
    ref
  ) => {
    const IconComponent = iconMap[variant || "default"];

    return (
      <Alert
        ref={ref}
        className={cn(notificationAlertVariants({ variant }), "flex items-start gap-3 pr-10", className)}
        {...props}
      >
        <div className="pt-1">
          {icon || <IconComponent className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          {title && <AlertTitle className="mb-1 font-medium">{title}</AlertTitle>}
          <AlertDescription className="text-sm">{children}</AlertDescription>
        </div>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </Alert>
    );
  }
);

NotificationAlert.displayName = "NotificationAlert";

export { NotificationAlert };
