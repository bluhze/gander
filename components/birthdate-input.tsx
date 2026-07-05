"use client";

import { formatBirthdateInputValue, inputClassName, labelClassName } from "@/lib/profile";

type BirthdateInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

export function BirthdateInput({
  id = "birthdate",
  value,
  onChange,
}: BirthdateInputProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        Date of birth
      </label>
      <input
        id={id}
        type="text"
        required
        inputMode="numeric"
        autoComplete="bday"
        value={value}
        onChange={(event) => onChange(formatBirthdateInputValue(event.target.value))}
        className={inputClassName}
        placeholder="DD/MM/YYYY"
        maxLength={10}
      />
      <p className="mt-1 text-xs text-zinc-500">Format: DD/MM/YYYY. You must be 18 or older.</p>
    </div>
  );
}
