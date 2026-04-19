"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendPoint } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: TrendPoint[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6dfea" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #d6dfea",
                boxShadow: "0 12px 32px rgba(16,37,68,0.12)",
              }}
            />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#173765"
              strokeWidth={3}
              dot={{ r: 4, fill: "#173765" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="variance"
              stroke="#bf2430"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#bf2430" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
