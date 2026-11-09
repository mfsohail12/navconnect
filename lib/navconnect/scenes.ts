// Which illustration to show for each route step. Pure data: the drawings live in
// components/patient/scenes/. To use real photos later, map `backdrop` to an image instead.

import type { LandmarkId } from "./i18n";
import type { ElevatorName, Side, Step } from "./types";

export type BackdropId =
  | "revolving"
  | "giftShop"
  | "coffee"
  | "blueElevator"
  | "cancerCentre"
  | "cWing"
  | "aWing"
  | "foodCourt"
  | "yellowElevator"
  | "gWing"
  | "elevator"
  | "escalator"
  | "destDoor";

/** Landmark id (see `LM_EN_PLAIN`) → backdrop for steps that happen at a landmark. */
const LANDMARK_BACKDROP: Record<Exclude<LandmarkId, "start">, BackdropId> = {
  revolving: "revolving",
  gift: "giftShop",
  aWing: "aWing",
  coffee: "coffee",
  gElev: "blueElevator",
  cancer: "cancerCentre",
  hallEnd: "aWing",
  food: "foodCourt",
  yellow: "yellowElevator",
  gWing: "gWing",
  cWing: "cWing",
};

/** Which wall a "continue past X" landmark is on. */
const LANDMARK_SIDE: Record<string, "left" | "right"> = {
  revolving: "left",
  gift: "left",
  coffee: "right",
  gElev: "right",
  cancer: "left",
  cWing: "right",
};

export type Scene = {
  backdrop: BackdropId;
  /** Wall the landmark is on, for "continue past X" steps. */
  wallSide?: "left" | "right";
  /** Direction of the turn arrow, for left and right steps. */
  turn?: "left" | "right";
  /** Elevator colour, for elevator steps. */
  elevator?: ElevatorName;
  /** Floor an elevator or escalator goes to. */
  floor?: number | "B1";
  /** Where the destination door is, for the arrive step. */
  side?: Side;
};

export function sceneFor(step: Step): Scene {
  switch (step.a) {
    case "elev":
      return { backdrop: "elevator", elevator: step.el, floor: step.f };
    case "down":
      return { backdrop: "escalator", floor: step.f };
    case "arrive":
      return { backdrop: "destDoor", side: step.side };
    case "left":
    case "right":
      return { backdrop: backdropFor(step), turn: step.a };
    case "straight":
      return { backdrop: backdropFor(step), wallSide: step.lm ? LANDMARK_SIDE[step.lm] : undefined };
  }
}

function backdropFor(step: Step): BackdropId {
  const known = LANDMARK_BACKDROP as Record<string, BackdropId | undefined>;
  return (step.lm && known[step.lm]) || "aWing";
}
