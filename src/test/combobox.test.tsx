import { describe, expect, it } from "vitest";
import { comboboxFilter } from "@/components/Combobox";

const states = [
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
];

const results = (query: string) => states
  .map((option) => ({ ...option, score: comboboxFilter(option.value, query, [option.label]) }))
  .filter((option) => option.score > 0)
  .sort((a, b) => b.score - a.score)
  .map((option) => option.label);

describe("Combobox filter ranking", () => {
  it("Fl returns Florida first and excludes District of Columbia", () => {
    expect(results("Fl")).toEqual(["Florida"]);
  });
  it("new returns all four New states", () => {
    expect(results("new")).toEqual(["New Hampshire", "New Jersey", "New Mexico", "New York"]);
  });
  it("ranks label prefixes above word prefixes above option values", () => {
    expect(comboboxFilter("FL", "fl", ["Florida"])).toBeGreaterThan(comboboxFilter("XX", "fl", ["West Florida"]));
    expect(comboboxFilter("XX", "fl", ["West Florida"])).toBeGreaterThan(comboboxFilter("FL", "fl", ["Other"]));
  });
  it("supports existing State options with code labels and name descriptions", () => {
    expect(comboboxFilter("FL", "Fl", ["FL", "Florida"])).toBeGreaterThan(0);
    expect(comboboxFilter("DC", "Fl", ["DC", "District of Columbia"])).toBe(0);
    expect(states.filter((state) => comboboxFilter(state.value, "new", [state.value, state.label]) > 0).map((state) => state.label))
      .toEqual(["New Hampshire", "New Jersey", "New Mexico", "New York"]);
  });
});