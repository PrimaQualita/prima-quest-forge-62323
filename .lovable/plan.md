

## Adicionar abas de visualização nos gráficos individuais por contrato

Cada card de contrato individual (componente `ContractCandlestickChart`) passará a ter 3 abas de visualização: **Mensal**, **Pareto** e **Pizza**, todas usando cores distintas por mês.

---

### Visão geral

O componente `ContractCandlestickChart.tsx` será refatorado para incluir:

1. **Aba "Mensal" (padrão atual)** -- Gráfico de barras com área + linha de média, mas agora cada barra terá uma cor diferente por mês (paleta de 12 cores).

2. **Aba "Pareto"** -- Gráfico combinado com barras ordenadas do maior para o menor volume e uma linha de porcentagem acumulada (eixo direito, 0-100%), seguindo o princípio de Pareto clássico. Cada barra terá cor distinta por mês.

3. **Aba "Pizza"** -- Gráfico de pizza/donut mostrando a proporção de análises de cada mês, com cores distintas por mês e legenda.

---

### Detalhes técnicos

**Arquivo:** `src/components/contracts/ContractCandlestickChart.tsx`

**Alteracoes:**

- Adicionar estado local `activeView` com valores `"mensal" | "pareto" | "pizza"`, padrão `"mensal"`.
- Criar paleta de 12 cores para os meses (uma cor por mês).
- No header do card, adicionar 3 botoes/abas compactas ("Mensal", "Pareto", "Pizza") estilizadas como as abas já usadas no `AnnualContractComparisonChart`.
- **Mensal**: Manter o `ComposedChart` atual mas usar a cor correspondente de cada mês nas barras (via shape customizado ou Cell do Recharts).
- **Pareto**: Ordenar `monthlyData` por count decrescente, calcular percentual acumulado, renderizar `ComposedChart` com `Bar` (cores por mês) + `Line` (% acumulada) com `YAxis` secundário.
- **Pizza**: Renderizar `PieChart` com `Pie` + `Cell` para cada mês que tenha count > 0, com tooltip e legenda.

**Paleta de cores (12 meses):**
```text
Jan=#3b82f6  Fev=#8b5cf6  Mar=#ec4899  Abr=#f97316
Mai=#eab308  Jun=#22c55e  Jul=#06b6d4  Ago=#6366f1
Set=#14b8a6  Out=#f43f5e  Nov=#a855f7  Dez=#0ea5e9
```

**Imports adicionais:** `PieChart, Pie, Cell` do recharts e `useState` do React.

Nenhuma alteracao de banco de dados ou outros arquivos necessaria.

