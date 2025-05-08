// src/components/SteamReviewInput.tsx
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface SteamReviewInputProps {
  onFetch: (appId: string) => void;
  isLoading: boolean;
}

export function SteamReviewInput({
  onFetch,
  isLoading,
}: SteamReviewInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFetch = () => {
    setError(null);

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
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
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

function extractSteamAppId(input: string): string | null {
  if (/^\d+$/.test(input)) {
    return input;
  }

  try {
    const urlObj = new URL(input);
    if (
      urlObj.hostname === "store.steampowered.com" ||
      urlObj.hostname === "steamcommunity.com"
    ) {
      const pathParts = urlObj.pathname.split("/");
      const appIndex = pathParts.findIndex((part) => part === "app");

      if (appIndex !== -1 && pathParts[appIndex + 1]) {
        return pathParts[appIndex + 1];
      }
    }
  } catch (e) {
    // null
  }

  return null;
}
