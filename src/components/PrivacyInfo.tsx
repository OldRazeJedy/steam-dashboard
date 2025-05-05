import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { InfoIcon } from "lucide-react";

export function PrivacyInfo() {
  return (
    <Alert className="mt-4">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Note about profile privacy</AlertTitle>
      <AlertDescription>
        The Steam API allows you to get the friends list for public profiles
        only.
      </AlertDescription>
    </Alert>
  );
}
