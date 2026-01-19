import { Link } from "react-router-dom";
import { TouchButton } from "@/components/ui/TouchButton";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-8xl font-bold text-muted-foreground/30">404</div>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/">
        <TouchButton variant="primary" className="gap-2">
          <Home className="w-5 h-5" />
          Back to Dashboard
        </TouchButton>
      </Link>
    </div>
  );
};

export default NotFound;
