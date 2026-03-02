import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BIKpiCard } from "@/components/reports/BIKpiCard";
import { BIGaugeChart } from "@/components/reports/BIGaugeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Line, AreaChart, Area, ComposedChart } from "recharts";

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

      {/* Row 5: Coverage Gauge + Analysis Ranking + Fill Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coverage - contracts with at least 1 analysis */}
        {(() => {
          const contractsWithDocs = docsPerContract?.filter(d => d.count > 0).length || 0;
          const coveragePct = totalContracts > 0 ? (contractsWithDocs / totalContracts) * 100 : 0;
          return (
            <BIGaugeChart
              title="Cobertura de Análises"
              value={coveragePct}
              total={`${contractsWithDocs} de ${totalContracts} contratos analisados`}
              color="hsl(var(--primary))"
              icon={<FileText className="w-4 h-4" />}
            />
          );
        })()}

        {/* Average analyses per active contract */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Média por Contrato Vigente
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[calc(100%-60px)]">
              {(() => {
                const activeDocsCount = docsPerContract?.filter(d => d.is_active).reduce((s, d) => s + d.count, 0) || 0;
                const activeCount = activeContracts.length || 1;
                const avg = (activeDocsCount / activeCount).toFixed(1);
                const maxDoc = docsPerContract?.filter(d => d.is_active).reduce((m, d) => d.count > (m?.count || 0) ? d : m, docsPerContract[0]);
                const minDoc = docsPerContract?.filter(d => d.is_active && d.count >= 0).reduce((m, d) => d.count < (m?.count ?? Infinity) ? d : m, docsPerContract[0]);
                return (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-primary">{avg}</span>
                      <span className="text-sm text-muted-foreground">análises/contrato</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>📈 Máximo: <span className="font-medium text-foreground">{maxDoc?.count || 0}</span> ({maxDoc?.name ? (maxDoc.name.length > 25 ? maxDoc.name.substring(0, 23) + '…' : maxDoc.name) : '-'})</p>
                      <p>📉 Mínimo: <span className="font-medium text-foreground">{minDoc?.count ?? 0}</span> ({minDoc?.name ? (minDoc.name.length > 25 ? minDoc.name.substring(0, 23) + '…' : minDoc.name) : '-'})</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly average */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ritmo de Análises
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[calc(100%-60px)]">
              {(() => {
                const currentMonth = new Date().getMonth(); // 0-indexed
                const monthsElapsed = year === new Date().getFullYear() ? Math.max(currentMonth, 1) : 12;
                const monthlyAvg = (totalDocs / monthsElapsed).toFixed(1);
                const projected = Math.round(Number(monthlyAvg) * 12);
                const bestMonth = monthlyTrend?.reduce((m, d) => d.total > (m?.total || 0) ? d : m, monthlyTrend[0]);
                return (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-secondary">{monthlyAvg}</span>
                      <span className="text-sm text-muted-foreground">análises/mês</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>🎯 Projeção anual: <span className="font-medium text-foreground">{projected} análises</span></p>
                      {bestMonth && bestMonth.total > 0 && (
                        <p>🏆 Melhor mês: <span className="font-medium text-foreground">{bestMonth.month}</span> ({bestMonth.total} análises)</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 6: Stacked Monthly Distribution by Contract */}
      {docsPerContract && docsPerContract.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Ranking de Análises por Contrato — {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const sorted = [...(docsPerContract || [])].sort((a, b) => b.count - a.count).slice(0, 10);
                const maxCount = Math.max(...sorted.map(d => d.count), 1);
                return (
                  <div className="space-y-3">
                    {sorted.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6 text-right">{i + 1}º</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground truncate max-w-[250px]">{item.name}</span>
                            <span className="text-xs font-bold text-primary ml-2">{item.count}</span>
                          </div>
                          <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-secondary/15 text-secondary' : 'bg-destructive/15 text-destructive'}`}>
                          {item.is_active ? 'Vigente' : 'Encerrado'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 7: Pareto - Top contracts contributing to 80% of analyses */}
      {docsPerContract && totalDocs > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Concentração de Análises (Pareto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const sorted = [...docsPerContract].filter(d => d.count > 0).sort((a, b) => b.count - a.count);
                let cumPct = 0;
                const paretoData = sorted.map(item => {
                  cumPct += (item.count / totalDocs) * 100;
                  return {
                    name: item.name.length > 18 ? item.name.substring(0, 16) + '…' : item.name,
                    fullName: item.name,
                    analises: item.count,
                    percentual_acumulado: Math.round(cumPct),
                  };
                });
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paretoData} margin={{ top: 10, right: 40, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="font-medium mb-1">{d?.fullName}</p>
                            <p style={{ color: 'hsl(var(--primary))' }}>Análises: {d?.analises}</p>
                            <p style={{ color: 'hsl(var(--destructive))' }}>Acumulado: {d?.percentual_acumulado}%</p>
                          </div>
                        );
                      }} />
                      <Bar yAxisId="left" dataKey="analises" name="Análises" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="percentual_acumulado" name="% Acumulado" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--destructive))' }} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
