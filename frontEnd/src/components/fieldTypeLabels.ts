import type { FieldType } from "../types";

export const FIELD_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Paragraph" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
];

export function getFieldTypeLabel(fieldType: FieldType | string) {
  switch (fieldType) {
    case "TEXT":
    case "text":
      return "Text";
    case "TEXTAREA":
    case "textarea":
      return "Paragraph";
    case "NUMBER":
    case "number":
      return "Number";
    case "EMAIL":
    case "email":
      return "Email";
    case "DATE":
    case "date":
      return "Date";
    case "SELECT":
    case "select":
      return "Dropdown";
    case "RADIO":
    case "radio":
      return "Multiple choice";
    case "CHECKBOX":
    case "checkbox":
      return "Checkbox";
    default:
      return String(fieldType);
  }
}