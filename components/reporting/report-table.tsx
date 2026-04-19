"use client";

import { SeverityBadge } from "@/components/reporting/severity-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ReportTable({
  rows,
}: {
  rows: Array<Record<string, string | number | null>>;
}) {
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">No report rows match the current filters.</div>;
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/80 bg-white">
      <div className="max-w-full overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/70">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>
                  {header.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {headers.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`}>
                    {header === "severity" && typeof row[header] === "string" ? (
                      <SeverityBadge severity={row[header]} />
                    ) : (
                      <span>{row[header] ?? "-"}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
