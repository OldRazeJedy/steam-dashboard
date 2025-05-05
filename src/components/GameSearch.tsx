// src/components/GameSearch.tsx
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface GameSearchProps {
  steamUrl: string;
  onUrlChange: (url: string) => void;
  onSearch: () => void;
  loading: boolean;
}

export function GameSearch({
  steamUrl,
  onUrlChange,
  onSearch,
  loading,
}: GameSearchProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Paste the game link from Steam"
        value={steamUrl}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      <Button onClick={onSearch} disabled={loading}>
        {loading ? "Loading..." : "Fetch"}
      </Button>
    </div>
  );
}
