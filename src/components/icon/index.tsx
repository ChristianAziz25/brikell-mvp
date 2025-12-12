import { cn } from "@/lib/utils";
import Image from "next/image";

export function Icon({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-9", className)}>
      <Image
        src="/Brikell.webp"
        alt="Brikell"
        fill
        className="object-contain w-full h-full"
      />
    </div>
  );
}
