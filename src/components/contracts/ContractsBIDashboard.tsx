import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BIKpiCard } from "@/components/reports/BIKpiCard";
import { BIGaugeChart } from "@/components/reports/BIGaugeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, AreaChart, Area } from "recharts";

interface ContractsBIDashboardProps {
  contracts: any[] | undefined;
  year: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(340, 82%, 52%)',
];

export const ContractsBIDashboard = ({ contracts, year }: ContractsBIDashboardProps) => {
  const activeContracts = contracts?.filter(c => c.is_active) || [];
  const inactiveContracts = contracts?.filter(c => !c.is_active) || [];
  const totalContracts = contracts?.length || 0;

  // Fetch employees per contract
  const { data: employeesPerContract } = useQuery({
    queryKey: ['employees-per-contract-bi'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('management_contract_id')
        .eq('is_active', true)
        .not('management_contract_id', 'is', null);
      
      const countMap = new Map<string, number>();
      data?.forEach(e => {
        const id = e.management_contract_id!;
        countMap.set(id, (countMap.get(id) || 0) + 1);
      });
      return countMap;
    },
  });

  // Fetch total documents per contract for the year
  const { data: docsPerContract } = useQuery({
    queryKey: ['docs-per-contract-bi', year, contracts?.map(c => c.id)],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const results = await Promise.all(
        contracts.map(async (contract) => {
          const { count } = await supabase
            .from('contract_documents')
            .select('*', { count: 'exact', head: true })
            .eq('contract_id', contract.id)
            .eq('year', year);
          return { id: contract.id, name: contract.name, count: count || 0, is_active: contract.is_active };
        })
      );
      return results;
    },
    enabled: !!contracts && contracts.length > 0,
  });

  // Fetch monthly distribution for trend chart
  const { data: monthlyTrend } = useQuery({
    queryKey: ['monthly-trend-bi', year, contracts?.map(c => c.id)],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          const month = index + 1;
          const { count } = await supabase
            .from('contract_documents')
            .select('*', { count: 'exact', head: true })
            .eq('year', year)
            .eq('month', month);
          return { month: MONTHS[index], total: count || 0 };
        })
      );
      // Add cumulative
      let cumulative = 0;
      return monthlyData.map(d => {
        cumulative += d.total;
        return { ...d, cumulative };
      });
    },
    enabled: !!contracts && contracts.length > 0,
  });

  const totalDocs = docsPerContract?.reduce((sum, d) => sum + d.count, 0) || 0;
  const avgDocsPerContract = totalContracts > 0 ? Math.round(totalDocs / totalContracts) : 0;
  const contractWithMostDocs = docsPerContract?.reduce((max, d) => d.count > (max?.count || 0) ? d : max, docsPerContract[0]);

  // Status distribution for donut chart
  const statusData = [
    { name: 'Vigentes', value: activeContracts.length },
    { name: 'Encerrados', value: inactiveContracts.length },
  ];

  // Employees distribution per contract for horizontal bar
  const employeeBarData = contracts?.map(c => ({
    name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
    fullName: c.name,
    colaboradores: employeesPerContract?.get(c.id) || 0,
    analises: docsPerContract?.find(d => d.id === c.id)?.count || 0,
  })).sort((a, b) => b.colaboradores - a.colaboradores) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-medium mb-1">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BIKpiCard
          title="Total de Contratos"
          value={totalContracts}
          subtitle={`${activeContracts.length} vigentes`}
          icon={FolderOpen}
          color="primary"
          delay={0}
        />
        <BIKpiCard
          title="Contratos Vigentes"
          value={activeContracts.length}
          subtitle={`${totalContracts > 0 ? Math.round((activeContracts.length / totalContracts) * 100) : 0}% do total`}
          icon={CheckCircle2}
          color="secondary"
          delay={0.1}
        />
        <BIKpiCard
          title="Contratos Encerrados"
          value={inactiveContracts.length}
          subtitle={`${totalContracts > 0 ? Math.round((inactiveContracts.length / totalContracts) * 100) : 0}% do total`}
          icon={AlertTriangle}
          color="destructive"
          delay={0.2}
        />
        <BIKpiCard
          title={`Análises em ${year}`}
          value={totalDocs}
          subtitle={`Média: ${avgDocsPerContract} por contrato`}
          icon={FileText}
          color="accent"
          delay={0.3}
        />
      </div>

      {/* Row 2: Gauge + Donut + Top Contract */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BIGaugeChart
          title="Taxa de Contratos Vigentes"
          value={totalContracts > 0 ? (activeContracts.length / totalContracts) * 100 : 0}
          total={`${activeContracts.length} de ${totalContracts} contratos`}
          color="hsl(var(--secondary))"
          icon={<Activity className="w-4 h-4" />}
        />

        {/* Status Distribution Donut */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      <Cell fill="hsl(142, 76%, 36%)" />
                      <Cell fill="hsl(var(--destructive))" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
                  <span className="text-muted-foreground">Vigentes ({activeContracts.length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                  <span className="text-muted-foreground">Encerrados ({inactiveContracts.length})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Contract Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Destaque do Ano
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[calc(100%-60px)]">
              {contractWithMostDocs && contractWithMostDocs.count > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Contrato com mais análises</p>
                  <p className="text-base font-semibold text-foreground leading-tight">{contractWithMostDocs.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">{contractWithMostDocs.count}</span>
                    <span className="text-sm text-muted-foreground">análises</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalDocs > 0 ? Math.round((contractWithMostDocs.count / totalDocs) * 100) : 0}% do total de análises
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Nenhuma análise registrada em {year}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 3: Monthly Trend (Area Chart) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Evolução Mensal de Análises — {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Análises no Mês"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorTotal)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Acumulado"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Row 4: Employees & Docs per Contract */}
      {employeeBarData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Colaboradores e Análises por Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(250, employeeBarData.length * 50)}>
                <BarChart data={employeeBarData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="colaboradores" name="Colaboradores" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="analises" name="Análises" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
