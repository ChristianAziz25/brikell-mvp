"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, DollarSign, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Stage =
  | "Vacant"
  | "Terminated"
  | "Interest"
  | "Contract Sent"
  | "Contract Signed";

interface LeaseCard {
  id: string;
  unit: string;
  building: string;
  price: number;
  stage: Stage;
  daysInStage: number;
  tenant?: string;
  notes?: string;
}

const initialData: LeaseCard[] = [
  {
    id: "1",
    unit: "Unit A102",
    building: "Maple Tower",
    price: 1500,
    stage: "Vacant",
    daysInStage: 5,
  },
  {
    id: "2",
    unit: "Unit B205",
    building: "Oak Complex",
    price: 1800,
    stage: "Vacant",
    daysInStage: 12,
  },
  {
    id: "3",
    unit: "Unit D302",
    building: "Birch Plaza",
    price: 2400,
    stage: "Terminated",
    daysInStage: 7,
    notes: "Failed credit check",
  },
  {
    id: "4",
    unit: "Unit C301",
    building: "Pine Apartments",
    price: 2200,
    stage: "Interest",
    daysInStage: 2,
    tenant: "Sarah Miller",
  },
  {
    id: "5",
    unit: "Unit A105",
    building: "Maple Tower",
    price: 1500,
    stage: "Interest",
    daysInStage: 1,
    tenant: "John Doe",
  },
  {
    id: "6",
    unit: "Unit D401",
    building: "Birch Plaza",
    price: 2400,
    stage: "Interest",
    daysInStage: 3,
    tenant: "Mike Chen",
  },
  {
    id: "7",
    unit: "Unit B202",
    building: "Oak Complex",
    price: 1800,
    stage: "Contract Sent",
    daysInStage: 4,
    tenant: "Emily Davis",
  },
  {
    id: "8",
    unit: "Unit C305",
    building: "Pine Apartments",
    price: 2200,
    stage: "Contract Sent",
    daysInStage: 2,
    tenant: "Alex Johnson",
  },
  {
    id: "9",
    unit: "Unit A108",
    building: "Maple Tower",
    price: 1500,
    stage: "Contract Signed",
    daysInStage: 0,
    tenant: "Lisa Brown",
    notes: "Move-in: Nov 25",
  },
];

const stages: Stage[] = [
  "Vacant",
  "Terminated",
  "Interest",
  "Contract Sent",
  "Contract Signed",
];

function SortableCard({ card }: { card: LeaseCard }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all bg-white",
        isDragging && "ring-2 ring-ring z-50"
      )}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/flow/unit/${card.id}`)}
    >
      <CardContent className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-foreground" />
              {card.unit}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {card.building}
            </p>
          </div>
          <Badge variant="outline" className="border-border text-xs">
            <DollarSign className="h-3 w-3" />
            {card.price}
          </Badge>
        </div>
      </CardContent>
      <CardContent className="p-6 pt-0">
        <div className="space-y-2">
          {card.tenant && (
            <div className="flex items-center gap-2 text-xs">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground">{card.tenant}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {card.notes ||
              `${card.daysInStage} day${
                card.daysInStage !== 1 ? "s" : ""
              } in stage`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DragPreviewCard({ card }: { card: LeaseCard }) {
  return (
    <Card className="cursor-grabbing shadow-2xl transition-all bg-white w-80 pointer-events-none">
      <CardContent className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-foreground" />
              {card.unit}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {card.building}
            </p>
          </div>
          <Badge variant="outline" className="border-border text-xs">
            <DollarSign className="h-3 w-3" />
            {card.price}
          </Badge>
        </div>
      </CardContent>
      <CardContent className="p-6 pt-0">
        <div className="space-y-2">
          {card.tenant && (
            <div className="flex items-center gap-2 text-xs">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground">{card.tenant}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {card.notes ||
              `${card.daysInStage} day${
                card.daysInStage !== 1 ? "s" : ""
              } in stage`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  stage,
  cards,
  className,
}: {
  stage: Stage;
  cards: LeaseCard[];
  className?: string;
}) {
  const cardIds = cards.map((card) => card.id);
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage}`,
    data: { stage },
  });

  return (
    <div className={cn("shrink-0 w-full md:w-80", className)}>
      <div className="bg-muted/30 border border-border rounded-t-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm">{stage}</h3>
          <Badge variant="outline" className="text-xs">
            {cards.length}
          </Badge>
        </div>
      </div>
      <SortableContext items={cardIds}>
        <div
          ref={setNodeRef}
          data-stage={stage}
          className={cn(
            "bg-muted/10 border border-t-0 border-border rounded-b-xl p-3 h-[500px] overflow-y-auto space-y-3 transition-colors",
            isOver && "bg-muted/20"
          )}
        >
          {cards.length > 0 ? (
            cards.map((card) => <SortableCard key={card.id} card={card} />)
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No cards in this stage
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<LeaseCard[]>(initialData);
  const [selectedStage, setSelectedStage] = useState<Stage | "All">("All");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCardsByStage = (stage: Stage) => {
    return data.filter((card) => card.stage === stage);
  };

  const getStageCounts = () => {
    const counts: Record<Stage, number> = {
      Vacant: 0,
      Terminated: 0,
      Interest: 0,
      "Contract Sent": 0,
      "Contract Signed": 0,
    };
    data.forEach((card) => {
      counts[card.stage]++;
    });
    return counts;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCard = data.find((card) => card.id === active.id);
    if (!activeCard) return;

    const overId = over.id as string;

    if (overId.startsWith("column-")) {
      const targetStage = overId.replace("column-", "") as Stage;
      if (targetStage && targetStage !== activeCard.stage) {
        setData((items) =>
          items.map((item) =>
            item.id === active.id
              ? { ...item, stage: targetStage, daysInStage: 0 }
              : item
          )
        );
      }
      return;
    }

    const overCard = data.find((card) => card.id === overId);

    if (overCard) {
      if (activeCard.stage === overCard.stage) {
        const stageCards = getCardsByStage(activeCard.stage);
        const oldIndex = stageCards.findIndex((card) => card.id === active.id);
        const newIndex = stageCards.findIndex((card) => card.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newStageCards = arrayMove(stageCards, oldIndex, newIndex);
          setData((items) => {
            const otherCards = items.filter(
              (item) => item.stage !== activeCard.stage
            );
            return [...otherCards, ...newStageCards];
          });
        }
      } else {
        setData((items) =>
          items.map((item) =>
            item.id === active.id
              ? { ...item, stage: overCard.stage, daysInStage: 0 }
              : item
          )
        );
      }
    }
  };

  const stageCounts = getStageCounts();
  const filteredStages =
    selectedStage === "All"
      ? stages
      : stages.filter((stage) => stage === selectedStage);

  return (
    <div className="w-full h-screen">
      <div className="w-full">
        <div className="space-y-6 max-w-full">
          <div className="w-full p-6 ">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Leasing Pipeline
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Track prospects through the leasing process
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(["All", ...stages] as const).map((stage, index) => (
              <div
                key={stage}
                onClick={() =>
                  setSelectedStage(stage === "All" ? "All" : stage)
                }
                className={cn(
                  "flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border min-w-fit cursor-pointer transition-colors",
                  selectedStage === stage && "bg-muted/50",
                  index === 0 && "ml-6",
                  index === stages.length && "mr-4"
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {stage}
                </span>
                {stage !== "All" && (
                  <Badge variant="secondary" className="bg-muted/50 text-xs">
                    {stageCounts[stage]}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col md:flex-row p-4 md:p-0 md:pb-4 gap-4 overflow-x-auto pb-4 no-scrollbar">
              {filteredStages.map((stage, index) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  cards={getCardsByStage(stage)}
                  className={cn(
                    index === 0 && "md:ml-6",
                    index === filteredStages.length - 1 && "md:mr-6"
                  )}
                />
              ))}
            </div>
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
              style={{
                cursor: "grabbing",
              }}
            >
              {activeId
                ? (() => {
                    const card = data.find((card) => card.id === activeId);
                    if (!card) {
                      return null;
                    }
                    return (
                      <div style={{ transform: "rotate(5deg)" }}>
                        <DragPreviewCard card={card} />
                      </div>
                    );
                  })()
                : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
