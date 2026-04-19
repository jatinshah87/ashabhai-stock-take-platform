import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  {
    warehouse: "Ahmedabad DC",
    status: "On track",
    queue: "22 queued",
    variance: "1.8%",
    badge: "success" as const,
  },
  {
    warehouse: "Surat DC",
    status: "Audit watch",
    queue: "5 queued",
    variance: "3.1%",
    badge: "warning" as const,
  },
  {
    warehouse: "Cold Chain Unit",
    status: "Needs support",
    queue: "14 queued",
    variance: "4.4%",
    badge: "danger" as const,
  },
];

export function MiniStatusTable() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Network Status Foundation</CardTitle>
          <CardDescription>Table styling baseline for future reconciliation, count detail and variance reporting modules.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-[24px] border border-border/80 bg-white">
          <div className="max-w-full overflow-auto">
            <Table>
              <TableHeader className="bg-muted/70">
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.warehouse}>
                    <TableCell className="font-semibold">{row.warehouse}</TableCell>
                    <TableCell>
                      <Badge variant={row.badge}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.queue}</TableCell>
                    <TableCell>{row.variance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
