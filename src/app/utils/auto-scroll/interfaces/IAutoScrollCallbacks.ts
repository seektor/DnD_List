import { Orientation } from "../../../structures/Orientation";

export interface IAutoScrollCallbacks {
    cancel: () => void;
    setIncrement(orientation: Orientation, value: number)
}