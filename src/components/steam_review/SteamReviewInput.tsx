import { useState, type ChangeEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface SteamReviewInputProps {
  onFetch: (appId: string) => void;
  isLoading: boolean;
}

/**
 * Component for inputting and validating Steam game URLs or IDs
 * Extracts the Steam App ID and passes it to the parent component
 */
export function SteamReviewInput({
  onFetch,
  isLoading,
}: SteamReviewInputProps) {
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Updates the input state when the user types in the input field
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  /**
   * Handles the fetch request after validating the input
   */
  const handleFetch = (): void => {
    setError(null);

    if (!input.trim()) {
      setError("Please enter a Steam game URL or ID");
      return;
    }

    const appId = extractSteamAppId(input);

    if (!appId) {
      setError(
        "Game ID could not be found. Check the URL or enter a numeric ID.",
      );
      return;
    }

    onFetch(appId);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter the game link or game ID (for example, store.steampowered.com/app/570 or 570)"
          value={input}
          onChange={handleInputChange}
          className="flex-1"
          aria-label="Steam game URL or ID"
        />
        <Button onClick={handleFetch} disabled={isLoading || !input.trim()}>
          {isLoading ? "Loading..." : "Get Reviews"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Extracts a Steam App ID from various input formats
 * Handles direct numeric IDs and URLs with app IDs
 *
 * @param input - The user input (URL or direct ID)
 * @returns The extracted app ID or null if invalid
 */
function extractSteamAppId(input: string): string | null {
  // Direct numeric ID
  if (/^\d+$/.test(input.trim())) {
    return input.trim();
  }

  // URL format
  try {
    const urlObj = new URL(input);
    const validDomains = ["store.steampowered.com", "steamcommunity.com"];

    if (validDomains.includes(urlObj.hostname)) {
      const pathParts = urlObj.pathname.split("/");
      const appIndex = pathParts.findIndex((part) => part === "app");

      if (
        appIndex !== -1 &&
        pathParts[appIndex + 1] &&
        /^\d+$/.test(pathParts[appIndex + 1]!)
      ) {
        return pathParts[appIndex + 1]!;
      }
    }
  } catch {
    // URL parsing failed, continue to return null
  }

  return null;
}
