import { useId, useState } from "react";
interface Props {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  actionType?: string;
  onAction: (type: string, payload: Record<string, unknown>) => void;
}
export function SliderInput({
  label,
  min = 1000,
  max = 100000,
  step = 1000,
  defaultValue = 25000,
  unit = "",
  actionType = "SLIDER_CHANGE",
  onAction,
}: Props) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="slider-control">
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id}>
        {value.toLocaleString("es-MX")} {unit}
      </output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <button
        className="button secondary"
        onClick={() => onAction(actionType, { value })}
      >
        Actualizar consulta
      </button>
    </div>
  );
}
