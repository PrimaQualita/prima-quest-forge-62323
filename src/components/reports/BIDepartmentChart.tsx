import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";
import { Building2, ChevronRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface DepartmentData {
  department: string;
  total: number;
  docsRate: number;
  trainingRate: number;
  overallRate: number;
}

interface EmployeeCompliance {
  id: string;
  name: string;
  department?: string;
  management_contract_id?: string;
  docsAccepted: number;
  docsPending: number;
  trainingsCompleted: number;
  trainingsPending: number;
}

interface ContractInfo {
  id: string;
  name: string;
}

interface BIDepartmentChartProps {
  data: DepartmentData[];
  employees?: EmployeeCompliance[];
  contracts?: ContractInfo[];
  totalDocs?: number;
  totalTrainings?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1).replace('.', ',')}%
        </p>
      ))}
    </div>
  );
};

const fixEncoding = (text: string) => {
  return text
    .replace(/\uFFFD\uFFFD/g, 'ÇÃ')
    .replace(/\uFFFD/g, 'Ç');
};

const DetailList = ({ data }: { data: DepartmentData[] }) => (
  <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: Math.max(300, data.length * 50) }}>
    {data.map((dept, i) => (
      <div key={i} className="p-3 rounded-lg border border-border/30 bg-card/50 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground break-words">{fixEncoding(dept.department)}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{dept.total} colab.</span>
        </div>
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Regulamentos</span>
              <span className="font-semibold text-primary">{dept.docsRate.toFixed(1).replace('.', ',')}%</span>
            </div>
            <Progress value={dept.docsRate} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Treinamentos</span>
              <span className="font-semibold text-secondary">{dept.trainingRate.toFixed(1).replace('.', ',')}%</span>
            </div>
            <Progress value={dept.trainingRate} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Geral</span>
              <span className={`font-bold ${dept.overallRate >= 70 ? 'text-secondary' : dept.overallRate >= 40 ? 'text-amber-500' : 'text-destructive'}`}>
                {dept.overallRate.toFixed(1).replace('.', ',')}%
              </span>
            </div>
            <Progress value={dept.overallRate} className="h-1.5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ChartAndDetail = ({ data }: { data: DepartmentData[] }) => {
  const sortedData = [...data].sort((a, b) => b.overallRate - a.overallRate);
  const chartData = sortedData.map(d => ({ ...d, department: fixEncoding(d.department) }));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,1fr)] gap-6">
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="department" width={200} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="docsRate" name="Regulamentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="trainingRate" name="Treinamentos" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
      <DetailList data={sortedData} />
    </div>
  );
};

export const BIDepartmentChart = ({ data, employees, contracts, totalDocs = 0, totalTrainings = 0 }: BIDepartmentChartProps) => {
  const [activeTab, setActiveTab] = useState<"departments" | "contracts">("contracts");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const hasContractData = employees && contracts && contracts.length > 0;

  // Contract-level compliance data
  const contractData = useMemo(() => {
    if (!employees || !contracts) return [];
    return contracts.map(contract => {
      const contractEmployees = employees.filter(e => e.management_contract_id === contract.id);
      const total = contractEmployees.length;
      if (total === 0) return { department: contract.name, contractId: contract.id, total: 0, docsRate: 0, trainingRate: 0, overallRate: 0 };
      const docsAccepted = contractEmployees.reduce((s, e) => s + e.docsAccepted, 0);
      const trainingsCompleted = contractEmployees.reduce((s, e) => s + e.trainingsCompleted, 0);
      const maxDocs = total * totalDocs;
      const maxTrainings = total * totalTrainings;
      const docsRate = maxDocs > 0 ? (docsAccepted / maxDocs) * 100 : 0;
      const trainingRate = maxTrainings > 0 ? (trainingsCompleted / maxTrainings) * 100 : 0;
      return { department: contract.name, contractId: contract.id, total, docsRate, trainingRate, overallRate: (docsRate + trainingRate) / 2 };
    }).filter(c => c.total > 0);
  }, [employees, contracts, totalDocs, totalTrainings]);

  // Departments within selected contract
  const contractDeptData = useMemo(() => {
    if (!employees || !selectedContractId) return [];
    const contractEmployees = employees.filter(e => e.management_contract_id === selectedContractId);
    const deptMap = new Map<string, { total: number; docsAccepted: number; trainingsCompleted: number }>();
    contractEmployees.forEach(emp => {
      const dept = emp.department || 'Sem departamento';
      const cur = deptMap.get(dept) || { total: 0, docsAccepted: 0, trainingsCompleted: 0 };
      cur.total++;
      cur.docsAccepted += emp.docsAccepted;
      cur.trainingsCompleted += emp.trainingsCompleted;
      deptMap.set(dept, cur);
    });
    return Array.from(deptMap.entries()).map(([department, d]) => {
      const maxDocs = d.total * totalDocs;
      const maxTrainings = d.total * totalTrainings;
      const docsRate = maxDocs > 0 ? (d.docsAccepted / maxDocs) * 100 : 0;
      const trainingRate = maxTrainings > 0 ? (d.trainingsCompleted / maxTrainings) * 100 : 0;
      return { department, total: d.total, docsRate, trainingRate, overallRate: (docsRate + trainingRate) / 2 };
    });
  }, [employees, selectedContractId, totalDocs, totalTrainings]);

  const selectedContractName = contracts?.find(c => c.id === selectedContractId)?.name;

  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Taxa de Compliance por {activeTab === "departments" ? "Departamento" : "Contrato de Gestão"}
            </CardTitle>
            {hasContractData && (
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedContractId(null); }}>
                <TabsList className="h-8">
                  <TabsTrigger value="departments" className="text-xs px-3 h-7">Departamentos</TabsTrigger>
                  <TabsTrigger value="contracts" className="text-xs px-3 h-7">Contratos de Gestão</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "departments" && (
            <ChartAndDetail data={data} />
          )}

          {activeTab === "contracts" && !selectedContractId && (
            <>
              <p className="text-xs text-muted-foreground mb-4">Clique em um contrato para ver os departamentos</p>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,1fr)] gap-6">
                <ResponsiveContainer width="100%" height={Math.max(300, contractData.length * 50)}>
                  <BarChart data={contractData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="department" width={200} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="docsRate" name="Regulamentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="trainingRate" name="Treinamentos" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: Math.max(300, contractData.length * 50) }}>
                  {[...contractData].sort((a, b) => b.overallRate - a.overallRate).map((contract, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-border/30 bg-card/50 space-y-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      onClick={() => setSelectedContractId((contract as any).contractId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground break-words">{contract.department}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{contract.total} colab.</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">Regulamentos</span>
                            <span className="font-semibold text-primary">{contract.docsRate.toFixed(1).replace('.', ',')}%</span>
                          </div>
                          <Progress value={contract.docsRate} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">Treinamentos</span>
                            <span className="font-semibold text-secondary">{contract.trainingRate.toFixed(1).replace('.', ',')}%</span>
                          </div>
                          <Progress value={contract.trainingRate} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">Geral</span>
                            <span className={`font-bold ${contract.overallRate >= 70 ? 'text-secondary' : contract.overallRate >= 40 ? 'text-amber-500' : 'text-destructive'}`}>
                              {contract.overallRate.toFixed(1).replace('.', ',')}%
                            </span>
                          </div>
                          <Progress value={contract.overallRate} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "contracts" && selectedContractId && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedContractId(null)} className="gap-1 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </Button>
                <span className="text-sm font-medium text-foreground">{selectedContractName}</span>
              </div>
              {contractDeptData.length > 0 ? (
                <ChartAndDetail data={contractDeptData} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum departamento encontrado neste contrato</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
