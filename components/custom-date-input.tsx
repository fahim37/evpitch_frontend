"use client";

import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface CustomDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const yearsRange = (from: number, to: number) => {
  const arr: number[] = [];
  for (let y = from; y <= to; y++) arr.push(y);
  return arr;
};

const CustomDateInput = forwardRef<HTMLInputElement, CustomDateInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "MM/YYYY",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value || "");
    const [pickerMonth, setPickerMonth] = useState<number | null>(null);
    const [pickerYear, setPickerYear] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const years = yearsRange(currentYear - 80, currentYear + 10);

    useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    useEffect(() => {
      if (internalValue.includes("/")) {
        const [m, y] = internalValue.split("/");
        const mm = parseInt(m);
        const yy = parseInt(y);
        if (!Number.isNaN(mm)) setPickerMonth(mm);
        if (!Number.isNaN(yy)) setPickerYear(yy);
      }
    }, [internalValue]);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const clampMonth = (m: number) => Math.min(12, Math.max(1, m));

    const clampToToday = (mm: number, yyyy: number) => {
      if (yyyy > currentYear) return { mm: currentMonth, yyyy: currentYear };
      if (yyyy === currentYear && mm > currentMonth)
        return { mm: currentMonth, yyyy: currentYear };
      return { mm, yyyy };
    };

    const formatFromDigits = (digits: string) => {
      if (!digits) return "";
      if (digits.length === 1 && digits > "1") digits = "0" + digits;
      let mm = digits.slice(0, 2);
      let yyyy = digits.slice(2, 6);

      if (mm.length === 2) {
        let monthNum = clampMonth(Number(mm) || 1);
        mm = String(monthNum).padStart(2, "0");
      }
      let formatted = mm;
      if (yyyy.length > 0) formatted += "/" + yyyy;
      if (yyyy.length === 4) {
        const { mm: m, yyyy: y } = clampToToday(Number(mm), Number(yyyy));
        formatted = `${String(m).padStart(2, "0")}/${y}`;
      }
      return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
      const formatted = formatFromDigits(inputDigits);
      setInternalValue(formatted);
      onChange?.(formatted);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
      if (e.ctrlKey || e.metaKey) return;
      if (!/^[0-9]$/.test(e.key) && !allowed.includes(e.key)) e.preventDefault();
    };

    const applyPicker = (m?: number | null, y?: number | null) => {
      const month = m ?? pickerMonth ?? 1;
      const year = y ?? pickerYear ?? currentYear;
      const { mm, yyyy } = clampToToday(clampMonth(month), year);
      const newVal = `${String(mm).padStart(2, "0")}/${yyyy}`;
      setInternalValue(newVal);
      onChange?.(newVal);
      setOpen(false);
    };

    const clearValue = () => {
      setInternalValue("");
      onChange?.("");
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <Input
          {...props}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          maxLength={7}
          disabled={disabled}
          className={clsx("w-full cursor-text", className)}
        />

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg z-50 p-3"
            >
              <div className="flex gap-3">
                <select
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={pickerMonth ?? ""}
                  onChange={(ev) =>
                    setPickerMonth(Number(ev.target.value) || null)
                  }
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      {(i + 1).toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={pickerYear ?? ""}
                  onChange={(ev) => {
                    const val = Number(ev.target.value) || null;
                    setPickerYear(val);
                  }}
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={clearValue}>
                  Clear
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={() => applyPicker()}>
                  Apply
                </Button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Tip: You can also type <code>MMYYYY</code>. Future dates are not
                allowed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

CustomDateInput.displayName = "CustomDateInput";
export default CustomDateInput;
