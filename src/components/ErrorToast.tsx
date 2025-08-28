import { Button } from "@/components/ui/button";

interface ErrorToastProps {
  message: string;
  onRetry: () => void;
}

const ErrorToast = ({ message, onRetry }: ErrorToastProps) => (
  <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-destructive px-4 py-3 text-destructive-foreground shadow-lg">
    <span>{message}</span>
    <Button variant="outline" onClick={onRetry} className="h-8">
      Tentar novamente
    </Button>
  </div>
);

export default ErrorToast;
