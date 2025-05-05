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

  // Функція для валідації URL та отримання ID гри
  const handleFetch = () => {
    setError(null);

    // Спроба витягнути appId
    const appId = extractSteamAppId(input);

    if (!appId) {
      setError(
        "Не вдалося знайти ID гри. Перевірте URL або введіть числовий ID.",
      );
      return;
    }

    onFetch(appId);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Введіть посилання на гру або ID гри (напр. store.steampowered.com/app/570 або 570)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleFetch} disabled={isLoading || !input.trim()}>
          {isLoading ? "Завантаження..." : "Отримати рецензії"}
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

// Допоміжна функція для витягнення appId
function extractSteamAppId(input: string): string | null {
  // Перевірка чи це тільки числовий ID
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Спроба отримати ID з URL
  try {
    const urlObj = new URL(input);
    if (
      urlObj.hostname === "store.steampowered.com" ||
      urlObj.hostname === "steamcommunity.com"
    ) {
      // Витягуємо appId з URL
      const pathParts = urlObj.pathname.split("/");
      const appIndex = pathParts.findIndex((part) => part === "app");

      if (appIndex !== -1 && pathParts[appIndex + 1]) {
        return pathParts[appIndex + 1];
      }
    }
  } catch (e) {
    // URL не валідний, повертаємо null
  }

  return null;
}
