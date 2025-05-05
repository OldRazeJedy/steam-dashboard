// src/components/GameDisplay.tsx
import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import type { GameInfo } from "~/services/steamService";

interface GameDisplayProps {
  gameInfo: GameInfo | null;
}

export function GameDisplay({ gameInfo }: GameDisplayProps) {
  if (!gameInfo) return null;

  return (
    <Card>
      <CardContent className="mx-auto flex p-4">
        <div className="flex flex-col items-center gap-4">
          <Image
            src={gameInfo.header_image}
            alt={gameInfo.name}
            className="rounded"
            width={600}
            height={400}
          />
          <h2 className="text-xl font-bold">{gameInfo.name}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
