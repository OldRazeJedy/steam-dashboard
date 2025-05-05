import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface FriendSearchProps {
  profileInput: string;
  onProfileInputChange: (input: string) => void;
  onSearch: () => void;
  loading: boolean;
  steamId: string;
}

export function FriendSearch({
  profileInput,
  onProfileInputChange,
  onSearch,
  loading,
  steamId,
}: FriendSearchProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Enter Steam profile URL or username"
        value={profileInput}
        onChange={(e) => onProfileInputChange(e.target.value)}
      />
      <Button onClick={onSearch} disabled={loading}>
        {loading ? "Loading..." : "Get Friends"}
      </Button>

      {steamId && (
        <p className="text-muted-foreground text-sm">
          Resolved Steam ID: {steamId}
        </p>
      )}
    </div>
  );
}
