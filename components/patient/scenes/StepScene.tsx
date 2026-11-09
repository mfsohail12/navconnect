// The picture for one navigation step: an illustrated place (Backdrop) with a glowing path
// and arrow (PathOverlay). It re-mounts on every step so the change fades in.

import { sceneFor } from "@/lib/navconnect/scenes";
import type { Step } from "@/lib/navconnect/types";
import { cx } from "../cx";
import { Backdrop } from "./Backdrop";
import { PathOverlay } from "./PathOverlay";

type Props = {
  step: Step;
  /** Used as the picture's accessible description. */
  description: string;
  /** Changes with every step so the scene re-mounts. */
  sceneKey: string | number;
};

export function StepScene({ step, description, sceneKey }: Props) {
  const scene = sceneFor(step);
  return (
    <div key={sceneKey} className={cx("sc")} dir="ltr">
      <svg
        className={cx("sc-svg")}
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={description}
      >
        <Backdrop scene={scene} />
        <PathOverlay scene={scene} />
      </svg>
    </div>
  );
}
