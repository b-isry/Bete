import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "./cn";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, children, ...props }: TableProps) {
  return (
    <table className={cn("w-full text-left", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("bg-surface-container-low", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-outline-variant transition-colors hover:bg-surface-container-low",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-outline-variant px-4 py-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-4 font-body text-body-md text-on-surface",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
